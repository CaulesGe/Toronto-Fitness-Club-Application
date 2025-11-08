import {useState, useEffect, useRef} from "react";

export default function useFPS(windowMs = 5000) {
    const [fps, setFps] = useState(60);
    const [avgFps, setAvgFps] = useState(60);
    const timeQueueRef = useRef([]);
    const lastTimeRef = useRef(performance.now());
    const rafRef = useRef();

    useEffect(() => {

        const loop = (now) => {
            const lastTime = lastTimeRef.current;
            lastTimeRef.current = now;

            if (lastTime != null) {
                const delta = now - lastTime; // ms
                const currentFps = delta > 0 ? 1000 / delta : 0;
                setFps(Math.round(currentFps));


                // keep only samples within window
                const arr = timeQueueRef.current;
                arr.push({ timeStamp: now });
                const cutoff = now - windowMs;
                while (arr.length && arr[0].timeStamp < cutoff) arr.shift();


                // average FPS ≈ frames / seconds in window
                const seconds = Math.max((windowMs) / 1000, 0.001);
                const avg = Math.round(arr.length / seconds);
                setAvgFps(avg);
            }
            
            // run loop again on next frame
            rafRef.current = requestAnimationFrame(loop);
        }
        rafRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(rafRef.current);
    }, [windowMs]);

    return { fps, avgFps };
}