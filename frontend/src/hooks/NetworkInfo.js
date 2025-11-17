import React, { useEffect, useMemo, useRef, useState } from "react";

export default function useNetworkInfo() {
    const [info, setInfo] = useState({ supported: false });

    useEffect(() => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) {
            setInfo({ supported: false });
            return;
        }

        const update = () => {
            setInfo({
                supported: true,
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
            });
        };
        update();
        connection.addEventListener?.("change", update);
        return () => connection.removeEventListener?.("change", update);
    }, []);


    return info;
}