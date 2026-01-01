import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Building2, 
  CreditCard, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Loader2,
  Shield,
  Trash2
} from 'lucide-react';

interface DocumentType {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  required: boolean;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'rar_authorization',
    label: 'Autorizație RAR',
    description: 'Autorizația RAR pentru categoriile de lucrări efectuate',
    icon: Shield,
    required: true
  },
  {
    id: 'company_registration',
    label: 'Certificat Constatator ONRC',
    description: 'Certificat constatator cu CAEN 4520',
    icon: Building2,
    required: true
  },
  {
    id: 'cui_certificate',
    label: 'Certificat CUI/CIF',
    description: 'Certificat de Înregistrare Fiscală',
    icon: FileText,
    required: true
  },
  {
    id: 'bank_statement',
    label: 'Extras de Cont',
    description: 'Extras de cont bancar sau confirmare IBAN',
    icon: CreditCard,
    required: true
  },
  {
    id: 'identity_document',
    label: 'Act Identitate Administrator',
    description: 'CI/BI administrator sau reprezentant legal',
    icon: FileText,
    required: true
  }
];

interface UploadedDocument {
  document_type: string;
  file_url: string;
  file_name: string;
  status: string;
}

interface KYCDocumentUploadProps {
  existingDocuments?: UploadedDocument[];
  onDocumentsChange?: () => void;
  kycStatus?: string;
}

export const KYCDocumentUpload = ({ 
  existingDocuments = [], 
  onDocumentsChange,
  kycStatus = 'pending'
}: KYCDocumentUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [cuiNumber, setCuiNumber] = useState('');
  const [caenCode, setCaenCode] = useState('4520');

  const getDocumentByType = (type: string) => {
    return existingDocuments.find(d => d.document_type === type);
  };

  const handleUpload = async (documentType: string, file: File) => {
    if (!user) return;

    setUploading(documentType);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(filePath);

      // Save to garage_documents table
      const { error: dbError } = await supabase
        .from('garage_documents')
        .insert({
          garage_id: user.id,
          document_type: documentType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: 'Document încărcat',
        description: 'Documentul a fost încărcat cu succes și va fi verificat.',
      });

      onDocumentsChange?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut încărca documentul.',
        variant: 'destructive'
      });
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (documentType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Fișier prea mare',
        description: 'Dimensiunea maximă permisă este 10MB.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tip fișier invalid',
        description: 'Sunt acceptate doar PDF, JPG, PNG și WebP.',
        variant: 'destructive'
      });
      return;
    }

    handleUpload(documentType, file);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aprobat</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Respins</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />În verificare</Badge>;
    }
  };

  const getOverallStatusBadge = () => {
    switch (kycStatus) {
      case 'approved':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-4 w-4 mr-1" />
            KYC Aprobat
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-1" />
            KYC Respins
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="secondary">
            <Clock className="h-4 w-4 mr-1" />
            În Verificare
          </Badge>
        );
      case 'documents_submitted':
        return (
          <Badge variant="secondary">
            <FileText className="h-4 w-4 mr-1" />
            Documente Trimise
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            Documente Necesare
          </Badge>
        );
    }
  };

  const uploadedCount = DOCUMENT_TYPES.filter(d => getDocumentByType(d.id)).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verificare KYC / AML
            </CardTitle>
            <CardDescription>
              Încarcă documentele necesare pentru verificarea contului (Legea 129/2019)
            </CardDescription>
          </div>
          {getOverallStatusBadge()}
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{uploadedCount} din {DOCUMENT_TYPES.length} documente încărcate</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(uploadedCount / DOCUMENT_TYPES.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CUI and CAEN inputs */}
        <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="cui">CUI (Cod Unic de Identificare)</Label>
            <Input
              id="cui"
              placeholder="RO12345678"
              value={cuiNumber}
              onChange={(e) => setCuiNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caen">Cod CAEN Principal</Label>
            <Input
              id="caen"
              placeholder="4520"
              value={caenCode}
              onChange={(e) => setCaenCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">4520 = Întreținerea și repararea autovehiculelor</p>
          </div>
        </div>

        {/* Document Upload Areas */}
        <div className="space-y-3">
          {DOCUMENT_TYPES.map((docType) => {
            const existing = getDocumentByType(docType.id);
            const Icon = docType.icon;
            const isUploading = uploading === docType.id;

            return (
              <div 
                key={docType.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  existing 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-dashed border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${existing ? 'bg-green-500/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${existing ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {docType.label}
                        {docType.required && <span className="text-destructive">*</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{docType.description}</p>
                      {existing && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {existing.file_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {existing && getStatusBadge(existing.status)}
                    
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={handleFileSelect(docType.id)}
                        disabled={isUploading || kycStatus === 'approved'}
                      />
                      <Button 
                        variant={existing ? 'outline' : 'default'} 
                        size="sm"
                        disabled={isUploading || kycStatus === 'approved'}
                        asChild
                      >
                        <span>
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Se încarcă...
                            </>
                          ) : existing ? (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Înlocuiește
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Încarcă
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Important:</strong> Documentele vor fi verificate în maxim 48 de ore lucrătoare. 
            Veți primi o notificare când verificarea este finalizată. 
            Platforma nu va procesa plăți până când verificarea KYC nu este completă.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCDocumentUpload;
