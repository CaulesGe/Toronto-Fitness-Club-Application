// MapWrapper.jsx
import { useLoadScript } from "@react-google-maps/api";
import Map from "./Map";

export default function MapWrapper({ studios, mode }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyA7SCCkx8BeyK13Jo-NDiGPkCDqxjpGt14",
  });

  if (!isLoaded) return null;

  return <Map studios={studios} mode={mode} />;
}
