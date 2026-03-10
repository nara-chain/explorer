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
    alignItems: 'center',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '12px',
    fontWeight: 400,
    gap: '8px',
    letterSpacing: 'normal',
};

const dotStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color,
    borderRadius: '50%',
    boxShadow: `0 0 4px 0 ${color}`,
    flexShrink: 0,
    height: '5px',
    width: '5px',
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
