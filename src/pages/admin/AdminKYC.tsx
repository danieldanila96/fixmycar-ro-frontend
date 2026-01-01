import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Building2,
  ExternalLink,
  Loader2,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { toast } from 'sonner';
import { RARCategoryBadges, RARCategory } from '@/components/RARCategoryBadges';
import { Database } from '@/integrations/supabase/types';

type KycStatus = Database['public']['Enums']['kyc_status'];

interface GarageProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  full_name: string | null;
  city: string | null;
  county: string | null;
  cui: string | null;
  caen_code: string | null;
  rar_authorization: string | null;
  rar_categories: RARCategory[] | null;
  kyc_status: KycStatus | null;
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_rejection_reason: string | null;
  kyc_documents: Record<string, string> | null;
  phone: string | null;
  business_address: string | null;
}

interface GarageDocument {
  id: string;
  garage_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
}

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'În așteptare', color: 'bg-gray-500', icon: Clock },
  documents_submitted: { label: 'Documente trimise', color: 'bg-blue-500', icon: FileText },
  under_review: { label: 'În verificare', color: 'bg-yellow-500', icon: Eye },
  approved: { label: 'Aprobat', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Respins', color: 'bg-red-500', icon: XCircle },
};

const AdminKYC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedGarage, setSelectedGarage] = useState<GarageProfile | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch garages with KYC info
  const { data: garages, isLoading } = useQuery({
    queryKey: ['admin-kyc-garages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'garage')
        .order('kyc_submitted_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data as GarageProfile[];
    },
  });

  // Fetch documents for selected garage
  const { data: garageDocuments } = useQuery({
    queryKey: ['admin-garage-documents', selectedGarage?.user_id],
    queryFn: async () => {
      if (!selectedGarage) return [];
      const { data, error } = await supabase
        .from('garage_documents')
        .select('*')
        .eq('garage_id', selectedGarage.user_id)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as GarageDocument[];
    },
    enabled: !!selectedGarage,
  });

  // Update KYC status mutation
  const updateKycStatus = useMutation({
    mutationFn: async ({ userId, status, rejectionReason }: { 
      userId: string; 
      status: KycStatus; 
      rejectionReason?: string 
    }) => {
      const updateData: Record<string, unknown> = {
        kyc_status: status,
        kyc_reviewed_at: new Date().toISOString(),
      };
      
      if (status === 'rejected' && rejectionReason) {
        updateData.kyc_rejection_reason = rejectionReason;
      } else {
        updateData.kyc_rejection_reason = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);
      
      if (error) throw error;

      // Send email notification for approved/rejected status
      if (status === 'approved' || status === 'rejected') {
        try {
          const { error: notificationError } = await supabase.functions.invoke('send-kyc-notification', {
            body: {
              garageId: userId,
              status,
              rejectionReason: status === 'rejected' ? rejectionReason : undefined,
            },
          });
          
          if (notificationError) {
            console.error('Failed to send KYC notification:', notificationError);
          }
        } catch (err) {
          console.error('Error sending KYC notification:', err);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-garages'] });
      setReviewDialogOpen(false);
      setSelectedGarage(null);
      setRejectionReason('');
      const message = variables.status === 'approved' 
        ? 'Service-ul a fost aprobat și notificat' 
        : variables.status === 'rejected'
          ? 'Service-ul a fost respins și notificat'
          : 'Statusul KYC a fost actualizat';
      toast.success(message);
    },
    onError: () => {
      toast.error('Eroare la actualizarea statusului');
    },
  });

  // Filter garages
  const filteredGarages = garages?.filter(garage => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        garage.business_name?.toLowerCase().includes(query) ||
        garage.cui?.toLowerCase().includes(query) ||
        garage.city?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      if (garage.kyc_status !== statusFilter) return false;
    }

    return true;
  }) || [];

  // Stats
  const stats = {
    total: garages?.length || 0,
    pending: garages?.filter(g => g.kyc_status === 'pending').length || 0,
    documentsSubmitted: garages?.filter(g => g.kyc_status === 'documents_submitted').length || 0,
    underReview: garages?.filter(g => g.kyc_status === 'under_review').length || 0,
    approved: garages?.filter(g => g.kyc_status === 'approved').length || 0,
    rejected: garages?.filter(g => g.kyc_status === 'rejected').length || 0,
  };

  const handleApprove = () => {
    if (!selectedGarage) return;
    updateKycStatus.mutate({ userId: selectedGarage.user_id, status: 'approved' });
  };

  const handleReject = () => {
    if (!selectedGarage || !rejectionReason.trim()) {
      toast.error('Te rugăm să specifici motivul respingerii');
      return;
    }
    updateKycStatus.mutate({ 
      userId: selectedGarage.user_id, 
      status: 'rejected',
      rejectionReason: rejectionReason.trim()
    });
  };

  const handleSetUnderReview = () => {
    if (!selectedGarage) return;
    updateKycStatus.mutate({ userId: selectedGarage.user_id, status: 'under_review' });
  };

  const openReviewDialog = (garage: GarageProfile) => {
    setSelectedGarage(garage);
    setRejectionReason(garage.kyc_rejection_reason || '');
    setReviewDialogOpen(true);
  };

  return (
    <AdminLayout title="Verificare KYC" description="Gestionează verificarea documentelor și aprobarea service-urilor auto">
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total service-uri</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">În așteptare</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.documentsSubmitted}</div>
              <p className="text-xs text-muted-foreground">Documente trimise</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
              <p className="text-xs text-muted-foreground">În verificare</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Aprobate</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Respinse</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută după nume, CUI sau oraș..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrează după status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  <SelectItem value="pending">În așteptare</SelectItem>
                  <SelectItem value="documents_submitted">Documente trimise</SelectItem>
                  <SelectItem value="under_review">În verificare</SelectItem>
                  <SelectItem value="approved">Aprobat</SelectItem>
                  <SelectItem value="rejected">Respins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Garages Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Service-uri ({filteredGarages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredGarages.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Locație</TableHead>
                      <TableHead>CUI</TableHead>
                      <TableHead>Status KYC</TableHead>
                      <TableHead>Data trimiterii</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGarages.map((garage) => {
                      const statusConfig = garage.kyc_status 
                        ? KYC_STATUS_CONFIG[garage.kyc_status] 
                        : KYC_STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow key={garage.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{garage.business_name || 'Fără nume'}</p>
                                <p className="text-sm text-muted-foreground">{garage.full_name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {garage.city && garage.county 
                              ? `${garage.city}, ${garage.county}` 
                              : garage.county || '-'}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {garage.cui || '-'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.color} text-white flex items-center gap-1 w-fit`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {garage.kyc_submitted_at 
                              ? format(new Date(garage.kyc_submitted_at), 'd MMM yyyy', { locale: ro })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openReviewDialog(garage)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Verifică
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nu există service-uri care să corespundă criteriilor.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verificare KYC - {selectedGarage?.business_name}
              </DialogTitle>
              <DialogDescription>
                Verifică documentele și informațiile service-ului
              </DialogDescription>
            </DialogHeader>

            {selectedGarage && (
              <div className="space-y-6">
                {/* Business Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nume service</label>
                    <p className="font-medium">{selectedGarage.business_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Persoană de contact</label>
                    <p className="font-medium">{selectedGarage.full_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CUI</label>
                    <p className="font-medium">{selectedGarage.cui || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cod CAEN</label>
                    <p className="font-medium">{selectedGarage.caen_code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefon</label>
                    <p className="font-medium">{selectedGarage.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Locație</label>
                    <p className="font-medium">
                      {[selectedGarage.city, selectedGarage.county].filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Adresă</label>
                    <p className="font-medium">{selectedGarage.business_address || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Autorizație RAR</label>
                    <p className="font-medium">{selectedGarage.rar_authorization || '-'}</p>
                  </div>
                </div>

                {/* RAR Categories */}
                {selectedGarage.rar_categories && selectedGarage.rar_categories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Categorii RAR Autorizate
                    </label>
                    <RARCategoryBadges categories={selectedGarage.rar_categories} maxVisible={9} />
                  </div>
                )}

                {/* Documents */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Documente încărcate
                  </label>
                  {garageDocuments && garageDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {garageDocuments.map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{doc.document_type}</p>
                              <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Vizualizează
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-muted rounded-lg">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nu există documente încărcate
                      </p>
                    </div>
                  )}
                </div>

                {/* Current Status */}
                {selectedGarage.kyc_status && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Status curent
                    </label>
                    <Badge className={`${KYC_STATUS_CONFIG[selectedGarage.kyc_status].color} text-white`}>
                      {KYC_STATUS_CONFIG[selectedGarage.kyc_status].label}
                    </Badge>
                    {selectedGarage.kyc_rejection_reason && (
                      <p className="text-sm text-red-600 mt-2">
                        Motiv respingere: {selectedGarage.kyc_rejection_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection Reason Input */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Motiv respingere (obligatoriu pentru respingere)
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Specifică motivul respingerii..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleSetUnderReview}
                disabled={updateKycStatus.isPending || selectedGarage?.kyc_status === 'under_review'}
              >
                <Eye className="h-4 w-4 mr-1" />
                Marchează în verificare
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={updateKycStatus.isPending}
              >
                {updateKycStatus.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Respinge
              </Button>
              <Button
                onClick={handleApprove}
                disabled={updateKycStatus.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {updateKycStatus.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Aprobă
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminKYC;
