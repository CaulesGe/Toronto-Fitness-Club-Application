import React, { useMemo, useCallback } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

export default React.memo(function Map({studios, mode, longitude, latitude}) {
    const navigate = useNavigate();
    const handleMarkerClick = useCallback(id => navigate(`/studios/${id}/details/`), [navigate]);

    const center = useMemo(() => {
        if (!longitude || !latitude) {
            if (!studios || studios.length === 0) {
                return { lat: 43.6532, lng: -79.3832 }; // fallback: Toronto
            }
            // center on first studio
            return {
                lat: studios[0].latitude,
                lng: studios[0].longitude,
            };
        }
        // e.g., center on first studio
        return {
            lat: latitude,
            lng: longitude,
        };
    }, [studios, latitude, longitude]);
    
    // Degradation: limit markers in degraded mode
    const effectiveStudios = useMemo(() => {
        if (!studios) return [];
        if (mode === "standard") return studios;
        // degraded: show at most 20 markers
        return studios.slice(0, 20);
    }, [studios, mode]);

    const options = useMemo(
        () =>
        mode === "standard"
            ? {
                // full interactivity
                disableDefaultUI: false,
                gestureHandling: "greedy",
                draggable: true,
                scrollwheel: true,
            }
            : {
                // degraded: static-ish map
                disableDefaultUI: true,
                draggable: false,
                scrollwheel: false,
                gestureHandling: "none",
            },
        [mode]
    );

    const markers = useMemo(() => (effectiveStudios || []).map(s => (
        <MarkerF
            key={s.id}
            position={{ lat: s.latitude, lng: s.longitude }}
            label={s.name}
            onClick={() => handleMarkerClick(s.id)}
        />
    )), [effectiveStudios, handleMarkerClick]
    );

    return (
        <GoogleMap center={center} zoom={mode === "standard" ? 12 : 11} options={options} mapContainerClassName="map-container"> 
            {markers}
        </GoogleMap>  
    )
})