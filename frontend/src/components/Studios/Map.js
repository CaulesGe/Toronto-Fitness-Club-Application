import React, { useMemo, useCallback } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

export default React.memo(function Map({studios}) {
    const navigate = useNavigate();
    const handleMarkerClick = useCallback(id => navigate(`/studios/${id}/details/`), [navigate]);
    const markers = useMemo(() => (studios || []).map(s => (
        <MarkerF
            key={s.id}
            position={{ lat: s.latitude, lng: s.longitude }}
            label={s.name}
            onClick={() => handleMarkerClick(s.id)}
        />
    )), [studios, handleMarkerClick]
    );
    
    return (
        <GoogleMap zoom={10} center={{lat: 44, lng: -80}} mapContainerClassName="map-container"> 
            {markers}
        </GoogleMap>  
    )
})