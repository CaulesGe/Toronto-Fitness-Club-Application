
import useNetworkInfo from "./NetworkInfo";
import useFPS from "./FPS";
import { useEffect, useMemo, useState } from "react";

export default function useAdaptiveMode() {
    const [mode, setMode] = useState('standard');
    const networkInfo = useNetworkInfo();
    const [fps, avgFps] = useFPS(5000);
    const [probe, setProbe] = useState(null);

    async function probeNetwork() {
        const start = performance.now();
        // Tiny resource (cache-busting)
        const url = '/favicon.ico?_probe=' + Math.random();
        try {
        const res = await fetch(url, { cache: 'no-store' });
        const blob = await res.blob(); // read so it's measured
        const duration = performance.now() - start; // ms
        // Very rough downlink estimate: bytes / seconds
        const kb = blob.size / 1024;
        const seconds = Math.max(duration / 1000, 0.001);
        const kbps = (kb / seconds);
        return { duration, kbps };
        } catch (err) {
        return { error: true, err };
        }
    }

    useEffect(() => {
        async function runProbe() {
          const result = await probeNetwork();
          setProbe(result);
        }
    
        runProbe();
        const interval = setInterval(runProbe, 5000);
    
        return () => clearInterval(interval);
    }, []);
    
    const networkPoor = useMemo(() => {
        if (!networkInfo.supported) return false; // don't punish when unknown
        const slowType = networkInfo.effectiveType === "slow-2g" || networkInfo.effectiveType === "2g" || networkInfo.effectiveType === "3g";
        const lowDownlink = typeof networkInfo.downlink === "number" && networkInfo.downlink < 1.5; // Mbps threshold
        const highRtt = typeof networkInfo.rtt === "number" && networkInfo.rtt > 300;
        const lowKbps = probe && probe.kbps < 150;
        return slowType || lowDownlink || highRtt || lowKbps;
    }, [networkInfo, probe]);

    useEffect(()  => {
        if (mode === 'standard' && (avgFps < 30 || networkPoor)) {
          setMode('degraded')
        } else if (mode === 'degraded' && (avgFps >= 30 && !networkPoor)) {
          setMode('standard')
        }
        //console.log(`Mode: ${mode}, Avg FPS: ${avgFps}, Network Poor: ${networkPoor}`)
    }, [avgFps, networkPoor, mode])

    return mode;
}