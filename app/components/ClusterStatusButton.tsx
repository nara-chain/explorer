'use client';

import { useCluster, useClusterModal } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React, { useCallback, useState } from 'react';

function getCustomUrlClusterName(customUrl: string) {
    try {
        const url = new URL(customUrl);
        if (url.hostname === 'localhost') {
            return customUrl;
        }
        return `${url.protocol}//${url.hostname}`;
    } catch (e) {
        return customUrl;
    }
}

const containerStyle: React.CSSProperties = {
    alignItems: 'center',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '12px',
    fontWeight: 400,
    gap: '8px',
    letterSpacing: 'normal',
    textDecoration: 'none',
    transition: 'color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
};

const dotStyle = (color: string): React.CSSProperties => ({
    animation: 'nara-pulse 2s ease-in-out infinite',
    backgroundColor: color,
    borderRadius: '50%',
    boxShadow: `0 0 4px ${color}`,
    flexShrink: 0,
    height: '6px',
    width: '6px',
});

export const ClusterStatusButton = () => {
    const { status, cluster, name, customUrl } = useCluster();
    const [, setShow] = useClusterModal();
    const [hovered, setHovered] = useState(false);

    const onClickHandler = useCallback(() => setShow(true), [setShow]);
    const statusName = cluster !== Cluster.Custom ? `${name}` : getCustomUrlClusterName(customUrl);

    const hoverStyle: React.CSSProperties = {
        ...containerStyle,
        ...(hovered ? { color: '#e8e8e8' } : {}),
    };

    const handlers = {
        onClick: onClickHandler,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
    };

    switch (status) {
        case ClusterStatus.Connected:
            return (
                <span style={hoverStyle} {...handlers}>
                    <span style={dotStyle('#3df51a')} />
                    {statusName}
                </span>
            );

        case ClusterStatus.Connecting:
            return (
                <span style={hoverStyle} {...handlers}>
                    <span style={dotStyle('#fbbf24')} />
                    {statusName}
                </span>
            );

        case ClusterStatus.Failure:
            return (
                <span style={hoverStyle} {...handlers}>
                    <span style={dotStyle('#ff4444')} />
                    {statusName}
                </span>
            );
    }
};
