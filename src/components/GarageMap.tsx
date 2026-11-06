import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface GarageProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  city: string | null;
  county: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface GarageMapProps {
  garages: GarageProfile[];
  selectedCounty?: string;
}

type GarageFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: GarageProfile;
};

// Romanian cities with approximate coordinates
const CITY_COORDINATES: Record<string, [number, number]> = {
  'București': [26.1025, 44.4268],
  'Cluj-Napoca': [23.5897, 46.7712],
  'Timișoara': [21.2087, 45.7489],
  'Iași': [27.5615, 47.1585],
  'Constanța': [28.6348, 44.1598],
  'Craiova': [23.7949, 44.3302],
  'Brașov': [25.6012, 45.6427],
  'Galați': [28.0459, 45.4353],
  'Ploiești': [26.0225, 44.9433],
  'Oradea': [21.9189, 47.0465],
  'Brăila': [27.9598, 45.2692],
  'Arad': [21.3115, 46.1866],
  'Pitești': [24.8686, 44.8565],
  'Sibiu': [24.1469, 45.7929],
  'Bacău': [26.9146, 46.5670],
  'Târgu Mureș': [24.5517, 46.5386],
  'Baia Mare': [23.5845, 47.6567],
  'Buzău': [26.8169, 45.1500],
  'Botoșani': [26.6694, 47.7487],
  'Satu Mare': [22.8877, 47.7896],
  'Râmnicu Vâlcea': [24.3689, 45.0997],
  'Drobeta-Turnu Severin': [22.6563, 44.6317],
  'Suceava': [26.2554, 47.6517],
  'Piatra Neamț': [26.3841, 46.9275],
  'Târgu Jiu': [23.2736, 45.0378],
  'Tulcea': [28.7896, 45.1787],
  'Focșani': [27.1858, 45.6961],
  'Reșița': [21.8893, 45.3008],
  'Alba Iulia': [23.5714, 46.0731],
  'Bistrița': [24.4979, 47.1333],
  'Slobozia': [27.3647, 44.5648],
  'Călărași': [27.3288, 44.2011],
  'Giurgiu': [25.9599, 43.9037],
  'Vaslui': [27.7279, 46.6359],
  'Deva': [22.8981, 45.8784],
  'Zalău': [23.0522, 47.1918],
  'Sfântu Gheorghe': [25.7872, 45.8663],
  'Miercurea Ciuc': [25.7528, 46.3583],
  'Alexandria': [25.3345, 43.9716],
  'Slatina': [24.3517, 44.4304],
};

// County center coordinates for fallback
const COUNTY_COORDINATES: Record<string, [number, number]> = {
  'Alba': [23.5714, 46.0731],
  'Arad': [21.3115, 46.1866],
  'Argeș': [24.8686, 44.8565],
  'Bacău': [26.9146, 46.5670],
  'Bihor': [21.9189, 47.0465],
  'Bistrița-Năsăud': [24.4979, 47.1333],
  'Botoșani': [26.6694, 47.7487],
  'Brașov': [25.6012, 45.6427],
  'Brăila': [27.9598, 45.2692],
  'București': [26.1025, 44.4268],
  'Buzău': [26.8169, 45.1500],
  'Caraș-Severin': [21.8893, 45.3008],
  'Călărași': [27.3288, 44.2011],
  'Cluj': [23.5897, 46.7712],
  'Constanța': [28.6348, 44.1598],
  'Covasna': [25.7872, 45.8663],
  'Dâmbovița': [25.4598, 44.9302],
  'Dolj': [23.7949, 44.3302],
  'Galați': [28.0459, 45.4353],
  'Giurgiu': [25.9599, 43.9037],
  'Gorj': [23.2736, 45.0378],
  'Harghita': [25.7528, 46.3583],
  'Hunedoara': [22.8981, 45.8784],
  'Ialomița': [27.3647, 44.5648],
  'Iași': [27.5615, 47.1585],
  'Ilfov': [26.1025, 44.4268],
  'Maramureș': [23.5845, 47.6567],
  'Mehedinți': [22.6563, 44.6317],
  'Mureș': [24.5517, 46.5386],
  'Neamț': [26.3841, 46.9275],
  'Olt': [24.3517, 44.4304],
  'Prahova': [26.0225, 44.9433],
  'Satu Mare': [22.8877, 47.7896],
  'Sălaj': [23.0522, 47.1918],
  'Sibiu': [24.1469, 45.7929],
  'Suceava': [26.2554, 47.6517],
  'Teleorman': [25.3345, 43.9716],
  'Timiș': [21.2087, 45.7489],
  'Tulcea': [28.7896, 45.1787],
  'Vaslui': [27.7279, 46.6359],
  'Vâlcea': [24.3689, 45.0997],
  'Vrancea': [27.1858, 45.6961],
};

const GarageMap = ({ garages, selectedCounty }: GarageMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const clusterRef = useRef<Supercluster | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Mapbox token from secrets
  useEffect(() => {
    const fetchToken = async () => {
      const { data } = await supabase.functions.invoke('get-mapbox-token');
      if (data?.token) {
        setMapboxToken(data.token);
      }
      setIsLoading(false);
    };
    fetchToken();
  }, []);

  // Get coordinates for a garage
  const getCoordinates = useCallback((garage: GarageProfile): { coords: [number, number]; isExact: boolean } | null => {
    // Use exact GPS coordinates if available
    if (garage.latitude && garage.longitude) {
      return { coords: [garage.longitude, garage.latitude], isExact: true };
    }
    
    // Try city as fallback
    if (garage.city) {
      const cityCoords = CITY_COORDINATES[garage.city];
      if (cityCoords) return { coords: cityCoords, isExact: false };
    }
    
    // Try county as fallback
    if (garage.county) {
      const countyCoords = COUNTY_COORDINATES[garage.county];
      if (countyCoords) return { coords: countyCoords, isExact: false };
    }
    
    return null;
  }, []);

  // Create cluster marker element
  const createClusterMarker = useCallback((count: number) => {
    const el = document.createElement('div');
    el.className = 'cluster-marker';
    
    const size = count < 10 ? 40 : count < 50 ? 50 : 60;
    
    Object.assign(el.style, {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: 'hsl(var(--primary))',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: count < 10 ? '14px' : '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      cursor: 'pointer',
      border: '3px solid white'
    });
    
    el.textContent = String(count);
    el.setAttribute('aria-label', `Grup de ${count} service-uri auto`);
    
    return el;
  }, []);

  // Create individual garage marker
  const createGarageMarker = useCallback((garage: GarageProfile) => {
    const el = document.createElement('div');
    el.className = 'garage-marker';
    
    const markerInner = document.createElement('div');
    Object.assign(markerInner.style, {
      background: 'hsl(var(--primary))',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    });
    
    const displayName = garage.business_name?.substring(0, 20) || 'Service';
    markerInner.textContent = displayName + (garage.business_name && garage.business_name.length > 20 ? '...' : '');
    el.appendChild(markerInner);

    return el;
  }, []);

  // Create popup for a garage
  const createGaragePopup = useCallback((garage: GarageProfile) => {
    const popupContent = document.createElement('div');
    popupContent.style.padding = '8px';
    
    const popupTitle = document.createElement('h3');
    Object.assign(popupTitle.style, { margin: '0 0 8px', fontWeight: '600', fontSize: '14px' });
    popupTitle.textContent = garage.business_name || 'Service auto';
    popupContent.appendChild(popupTitle);
    
    const popupLocation = document.createElement('p');
    Object.assign(popupLocation.style, { margin: '0 0 4px', fontSize: '12px', color: '#666' });
    popupLocation.textContent = '📍 ' + [garage.city, garage.county].filter(Boolean).join(', ');
    popupContent.appendChild(popupLocation);
    
    if (garage.average_rating) {
      const popupRating = document.createElement('p');
      Object.assign(popupRating.style, { margin: '0 0 8px', fontSize: '12px' });
      popupRating.textContent = `⭐ ${garage.average_rating.toFixed(1)} (${garage.total_reviews} recenzii)`;
      popupContent.appendChild(popupRating);
    }
    
    const popupLink = document.createElement('a');
    popupLink.href = `/service/${garage.user_id}`;
    Object.assign(popupLink.style, { color: 'hsl(var(--primary))', fontSize: '12px', textDecoration: 'none' });
    popupLink.textContent = 'Vezi detalii →';
    popupContent.appendChild(popupLink);

    return new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);
  }, []);

  // Update markers based on current map view
  const updateMarkers = useCallback(() => {
    if (!map.current || !clusterRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = map.current.getBounds();
    const zoom = Math.floor(map.current.getZoom());

    const clusters = clusterRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates as [number, number];

      if (cluster.properties.cluster) {
        // It's a cluster
        const el = createClusterMarker(cluster.properties.point_count);
        
        el.addEventListener('click', () => {
          const expansionZoom = clusterRef.current?.getClusterExpansionZoom(cluster.properties.cluster_id as number) || zoom + 2;
          map.current?.flyTo({
            center: [lng, lat],
            zoom: Math.min(expansionZoom, 14)
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      } else {
        // It's an individual garage
        const garage = cluster.properties as GarageProfile;
        const el = createGarageMarker(garage);
        const popup = createGaragePopup(garage);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      }
    });
  }, [createClusterMarker, createGarageMarker, createGaragePopup]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Determine initial center based on selected county or default to Romania center
    let initialCenter: [number, number] = [25.0, 46.0];
    let initialZoom = 6.5;
    
    if (selectedCounty && selectedCounty !== 'all') {
      const countyCoords = COUNTY_COORDINATES[selectedCounty];
      if (countyCoords) {
        initialCenter = countyCoords;
        initialZoom = 9;
      }
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    map.current.on('moveend', updateMarkers);
    map.current.on('zoomend', updateMarkers);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedCounty, updateMarkers]);

  // Update cluster data when garages change
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Create GeoJSON features from garages
    const features: GarageFeature[] = [];
    
    garages.forEach(garage => {
      const result = getCoordinates(garage);
      if (!result) return;

      const { coords, isExact } = result;
      
      // Add small random offset only for non-exact coordinates
      const finalCoords: [number, number] = isExact 
        ? coords 
        : [
            coords[0] + (Math.random() - 0.5) * 0.02,
            coords[1] + (Math.random() - 0.5) * 0.02,
          ];

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: finalCoords
        },
        properties: { ...garage }
      });
    });

    // Initialize supercluster
    clusterRef.current = new Supercluster({
      radius: 60,
      maxZoom: 14,
      minZoom: 0
    });

    clusterRef.current.load(features);

    // Update markers
    updateMarkers();

    // Fit bounds to show all markers
    if (features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach(feature => {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [garages, mapboxToken, getCoordinates, updateMarkers]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-xl flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Harta nu este disponibilă momentan.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Reîncearcă
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default GarageMap;
