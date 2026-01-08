import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const SITE_NAME = 'FixMyCar.ro';
const DEFAULT_DESCRIPTION = 'Găsește service-uri auto de încredere în România. Cere oferte gratuite, compară prețuri și programează-te online pentru reparații auto, ITP, mecanică și multe altele.';
const BASE_URL = 'https://fixmycar.ro';
const DEFAULT_IMAGE = '/og-image.png';

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
}: SEOProps) => {
  const location = useLocation();
  const canonicalUrl = `${BASE_URL}${location.pathname}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ro_RO" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
};

export default SEO;
