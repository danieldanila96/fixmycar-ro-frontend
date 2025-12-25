import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const getCoordinates = (garage: GarageProfile): { coords: [number, number]; isExact: boolean } | null => {
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
  };

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

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedCounty]);

  // Update markers when garages change
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    garages.forEach(garage => {
      const result = getCoordinates(garage);
      if (!result) return;

      const { coords, isExact } = result;
      
      // Add small random offset only for non-exact coordinates to prevent overlapping
      const finalCoords: [number, number] = isExact 
        ? coords 
        : [
            coords[0] + (Math.random() - 0.5) * 0.02,
            coords[1] + (Math.random() - 0.5) * 0.02,
          ];

      const el = document.createElement('div');
      el.className = 'garage-marker';
      el.innerHTML = `
        <div style="
          background: hsl(var(--primary));
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          white-space: nowrap;
        ">
          ${garage.business_name?.substring(0, 20) || 'Service'}${garage.business_name && garage.business_name.length > 20 ? '...' : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">${garage.business_name || 'Service auto'}</h3>
          <p style="margin: 0 0 4px; font-size: 12px; color: #666;">
            📍 ${[garage.city, garage.county].filter(Boolean).join(', ')}
          </p>
          ${garage.average_rating ? `
            <p style="margin: 0 0 8px; font-size: 12px;">
              ⭐ ${garage.average_rating.toFixed(1)} (${garage.total_reviews} recenzii)
            </p>
          ` : ''}
          <a href="/service/${garage.user_id}" style="
            color: hsl(var(--primary));
            font-size: 12px;
            text-decoration: none;
          ">Vezi detalii →</a>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(finalCoords)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [garages, mapboxToken]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Harta nu este disponibilă. Verifică configurația Mapbox.</p>
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
