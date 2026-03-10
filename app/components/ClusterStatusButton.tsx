'use client';

import { useCluster, useClusterModal } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React, { useCallback } from 'react';

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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 400,
    color: '#888',
    letterSpacing: 'normal',
};

const dotStyle = (color: string): React.CSSProperties => ({
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: color,
    boxShadow: `0 0 4px 0 ${color}`,
    flexShrink: 0,
});

export const ClusterStatusButton = () => {
    const { status, cluster, name, customUrl } = useCluster();
    const [, setShow] = useClusterModal();

    const onClickHandler = useCallback(() => setShow(true), [setShow]);
    const statusName = cluster !== Cluster.Custom ? `${name}` : getCustomUrlClusterName(customUrl);

    switch (status) {
        case ClusterStatus.Connected:
            return (
                <span style={containerStyle} onClick={onClickHandler}>
                    <span style={dotStyle('#39ff14')} />
                    {statusName} Live
                </span>
            );

        case ClusterStatus.Connecting:
            return (
                <span style={containerStyle} onClick={onClickHandler}>
                    <span style={dotStyle('#fa62fc')} />
                    {statusName}
                </span>
            );

        case ClusterStatus.Failure:
            return (
                <span style={containerStyle} onClick={onClickHandler}>
                    <span style={dotStyle('#ff4444')} />
                    {statusName}
                </span>
            );
    }
};
