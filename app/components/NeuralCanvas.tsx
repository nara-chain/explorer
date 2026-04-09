'use client';

import { useEffect, useRef } from 'react';

export function NeuralCanvas() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const cv = ref.current;
        if (!cv) return;
        const cx = cv.getContext('2d');
        if (!cx) return;

        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const IS_MOBILE = window.innerWidth < 768;
        const COUNT = IS_MOBILE ? 30 : 70;
        let W: number = window.innerWidth, H: number = window.innerHeight;

        interface Point {
            x: number;
            y: number;
            ox: number;
            oy: number;
            vx: number;
            vy: number;
            pulse: number;
        }

        const pts: Point[] = [];
        let mx = -999,
            my = -999;
        let scrollY = 0;
        let active = true;

        function rsz() {
            W = window.innerWidth;
            H = window.innerHeight;
            cv!.width = W * DPR;
            cv!.height = H * DPR;
            cv!.style.width = W + 'px';
            cv!.style.height = H + 'px';
            cx!.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        rsz();

        let rszTimer: ReturnType<typeof setTimeout>;
        const debouncedRsz = () => {
            clearTimeout(rszTimer);
            rszTimer = setTimeout(rsz, 150);
        };
        window.addEventListener('resize', debouncedRsz);

        for (let i = 0; i < COUNT; i++) {
            const ox = Math.random() * W,
                oy = Math.random() * H;
            pts.push({
                ox,
                oy,
                pulse: Math.random() * Math.PI * 2,
                vx: (Math.random() - 0.5) * 0.7,
                vy: (Math.random() - 0.5) * 0.7,
                x: ox,
                y: oy,
            });
        }

        if (!IS_MOBILE)
            document.addEventListener('mousemove', e => {
                mx = e.clientX;
                my = e.clientY;
            });

        const onScroll = () => {
            scrollY = window.scrollY;
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        const CELL = 160;
        function buildGrid() {
            const g: Record<string, number[]> = {};
            pts.forEach((p, i) => {
                const k = `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`;
                if (!g[k]) g[k] = [];
                g[k].push(i);
            });
            return g;
        }

        function neighbors(grid: Record<string, number[]>, p: Point) {
            const res: number[] = [];
            const gx = Math.floor(p.x / CELL),
                gy = Math.floor(p.y / CELL);
            for (let dx = -1; dx <= 1; dx++)
                for (let dy = -1; dy <= 1; dy++) {
                    const k = `${gx + dx},${gy + dy}`;
                    if (grid[k]) grid[k].forEach(i => res.push(i));
                }
            return res;
        }

        const FPS = IS_MOBILE ? 20 : 30;
        const INTERVAL = 1000 / FPS;
        let lastFrame = 0;
        let rafId = 0;
        const MAX_CONN = 5;

        function draw(ts: number) {
            if (!active) return;
            if (ts - lastFrame < INTERVAL) {
                rafId = requestAnimationFrame(draw);
                return;
            }
            lastFrame = ts;
            cx!.clearRect(0, 0, W, H);
            cx!.save();
            cx!.translate(0, -scrollY * 0.15);

            const grid = buildGrid();
            const time = ts * 0.001;
            const connCount = new Uint8Array(COUNT);

            // Update positions
            pts.forEach((p, idx) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;

                // Repulsion
                neighbors(grid, p).forEach(j => {
                    if (j <= idx) return;
                    const b = pts[j],
                        rdx = p.x - b.x,
                        rdy = p.y - b.y;
                    const dist = Math.sqrt(rdx * rdx + rdy * rdy);
                    if (dist < 80 && dist > 0) {
                        const force = 0.5 * (1 - dist / 80);
                        p.x += (rdx / dist) * force;
                        p.y += (rdy / dist) * force;
                        b.x -= (rdx / dist) * force;
                        b.y -= (rdy / dist) * force;
                    }
                });

                // Pull back to origin
                p.vx += (p.ox - p.x) * 0.0003;
                p.vy += (p.oy - p.y) * 0.0003;

                // Mouse attraction
                const ddx = mx - p.x,
                    ddy = my - p.y,
                    dd = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dd < 200) {
                    p.x += ddx * 0.008;
                    p.y += ddy * 0.008;
                }
            });

            // Draw dots
            pts.forEach(p => {
                const pulse = 0.5 + 0.5 * Math.sin(time * 1.5 + p.pulse);
                const alpha = 0.4 + pulse * 0.6;
                cx!.beginPath();
                cx!.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                cx!.fillStyle = `rgba(57,255,20,${alpha})`;
                cx!.shadowColor = 'rgba(57,255,20,0.4)';
                cx!.shadowBlur = 3;
                cx!.fill();
                cx!.shadowBlur = 0;
            });

            // Draw connections
            pts.forEach((p, idx) => {
                if (connCount[idx] >= MAX_CONN) return;
                neighbors(grid, p).forEach(j => {
                    if (j <= idx) return;
                    if (connCount[idx] >= MAX_CONN || connCount[j] >= MAX_CONN) return;
                    const b = pts[j],
                        dx = p.x - b.x,
                        dy = p.y - b.y,
                        d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 180) {
                        connCount[idx]++;
                        connCount[j]++;
                        const lineAlpha = 0.25 * (1 - d / 180);
                        cx!.beginPath();
                        cx!.strokeStyle = `rgba(57,255,20,${lineAlpha})`;
                        cx!.lineWidth = 0.8;
                        cx!.moveTo(p.x, p.y);
                        cx!.lineTo(b.x, b.y);
                        cx!.stroke();
                    }
                });
            });

            cx!.restore();
            rafId = requestAnimationFrame(draw);
        }

        function startLoop() {
            rafId = requestAnimationFrame(draw);
        }
        function stopLoop() {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        function onVisChange() {
            if (!active) return;
            if (document.hidden) stopLoop();
            else startLoop();
        }
        document.addEventListener('visibilitychange', onVisChange);
        startLoop();

        return () => {
            active = false;
            stopLoop();
            clearTimeout(rszTimer);
            document.removeEventListener('visibilitychange', onVisChange);
            window.removeEventListener('resize', debouncedRsz);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return (
        <canvas
            ref={ref}
            style={{
                inset: 0,
                opacity: 0.3,
                pointerEvents: 'none',
                position: 'fixed',
                willChange: 'transform',
                zIndex: 0,
            }}
        />
    );
}
