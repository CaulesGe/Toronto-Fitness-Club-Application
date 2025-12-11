// MapWrapper.jsx
import { useLoadScript } from "@react-google-maps/api";
import Map from "./Map";

export default function MapWrapper({ studios, mode, longitude, latitude }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyA7SCCkx8BeyK13Jo-NDiGPkCDqxjpGt14",
  });

  if (!isLoaded) return null;

  return (
    <>
      {mode === "degraded" && (
        <div style={{ color: "red", marginBottom: "8px" }}>
          You are in lightweight mode. The map is static and shows a limited
          number of studios.
        </div>
      )}
      <Map studios={studios} mode={mode} longitude={longitude} latitude={latitude} />
    </>
 );
}
