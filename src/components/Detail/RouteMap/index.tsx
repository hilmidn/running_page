import { useMemo, useState } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { MapPin, Flag } from 'lucide-react';
import type { Activity } from '@/utils/utils';
import { decodePolyline } from '@/utils/activityAnalytics';
import { MAPBOX_TOKEN } from '@/utils/const';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  activity?: Activity;
  compact?: boolean;
}

function isValidCoord(lng: number, lat: number) {
  return isFinite(lng) && isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
}

function calculateBounds(coords: [number, number][]) {
  const valid = coords.filter(([lng, lat]) => isValidCoord(lng, lat));
  if (valid.length === 0) return null;

  const lngs = valid.map((c) => c[0]);
  const lats = valid.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const lngDiff = maxLng - minLng || 0.01;
  const latDiff = maxLat - minLat || 0.01;
  const padding = 0.02;

  return {
    longitude: (minLng + maxLng) / 2,
    latitude: (minLat + maxLat) / 2,
    zoom: Math.min(
      15,
      Math.max(
        10,
        Math.log2(360 / Math.max(lngDiff, latDiff)) - 1,
      ),
    ),
    bounds: {
      minLng: minLng - padding,
      maxLng: maxLng + padding,
      minLat: minLat - padding,
      maxLat: maxLat + padding,
    },
  };
}

export default function RouteMap({ activity, compact }: Props) {
  const polyline = activity?.summary_polyline;

  const routeCoords = useMemo(() => {
    if (!polyline) return [];
    return decodePolyline(polyline)
      .map((p) => [p.lng, p.lat] as [number, number])
      .filter(([lng, lat]) => isValidCoord(lng, lat));
  }, [polyline]);

  const initialView = useMemo(() => {
    if (routeCoords.length === 0) return null;
    return calculateBounds(routeCoords);
  }, [routeCoords]);

  const [viewState, setViewState] = useState(initialView ?? {
    longitude: 106.8,
    latitude: -6.2,
    zoom: 10,
  });

  const hasGPS = !!polyline && routeCoords.length > 1;

  const geojson = useMemo(() => {
    if (!hasGPS) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: routeCoords,
          },
        },
      ],
    };
  }, [hasGPS, routeCoords]);

  const startCoord = hasGPS && routeCoords[0] && isValidCoord(routeCoords[0][0], routeCoords[0][1])
    ? routeCoords[0]
    : null;
  const endCoord = hasGPS && routeCoords.length > 1
    ? routeCoords[routeCoords.length - 1]
    : null;
  const endCoordValid = endCoord && isValidCoord(endCoord[0], endCoord[1]);

  if (!hasGPS) {
    return (
      <div className="rounded-xl bg-gray-800/40 p-6 text-center">
        <MapPin className="mx-auto mb-2 text-gray-500" size={32} />
        <p className="text-sm text-gray-400">No GPS data available</p>
      </div>
    );
  }

  const mapHeight = compact ? 250 : 350;

  return (
    <div className="overflow-hidden rounded-xl bg-gray-800/30">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: mapHeight }}
        attributionControl={false}
        reuseMaps
      >
        {geojson && (
          <Source id="route" type="geojson" data={geojson}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#f59e0b',
                'line-width': 4,
                'line-opacity': 0.9,
                'line-blur': 1,
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
          </Source>
        )}

        {startCoord && (
          <Marker longitude={startCoord[0]} latitude={startCoord[1]} anchor="bottom">
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                Start
              </span>
              <Flag className="text-green-400" size={20} />
            </div>
          </Marker>
        )}

        {endCoordValid && (
          <Marker longitude={endCoord![0]} latitude={endCoord![1]} anchor="bottom">
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                End
              </span>
              <Flag className="text-red-400" size={20} />
            </div>
          </Marker>
        )}

        <NavigationControl position="bottom-right" />
      </Map>
    </div>
  );
}
