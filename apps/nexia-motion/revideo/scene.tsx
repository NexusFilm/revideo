/** @jsxImportSource @revideo/2d/lib */
import {
  Gradient,
  Layout,
  Rect,
  Txt,
  makeScene2D,
  Circle,
} from '@revideo/2d';
import { all, createRef, useScene, waitFor, easeOutCubic, easeInOutCubic } from '@revideo/core';

export default makeScene2D('trade-signal', function* (view) {
  // Pull in variables (with defaults)
  const coin    = useScene().variables.get('coin', 'BTC');
  const action  = useScene().variables.get('action', 'BUY');
  const price   = useScene().variables.get('price', '$84,200');
  const target  = useScene().variables.get('target', '$89,500');
  const reason  = useScene().variables.get('reason', 'Momentum + macro tailwind');
  const timeWindow = useScene().variables.get('timeWindow', '24–48h');

  const isBuy = action().toUpperCase() === 'BUY';
  const accentColor = isBuy ? '#00d4a0' : '#ff4560';

  // Background
  view.fill('#07080d');

  // Refs
  const containerRef = createRef<Rect>();
  const titleRef = createRef<Txt>();
  const coinRef = createRef<Txt>();
  const actionBadgeRef = createRef<Rect>();
  const actionTextRef = createRef<Txt>();
  const priceRef = createRef<Txt>();
  const targetRef = createRef<Txt>();
  const reasonRef = createRef<Txt>();
  const glowRef = createRef<Circle>();
  const barRef = createRef<Rect>();

  // Build scene
  view.add(
    <>
      {/* Glow orb */}
      <Circle
        ref={glowRef}
        width={500}
        height={500}
        fill={new Gradient({
          type: 'radial',
          from: [0, 0],
          to: [0, 250],
          stops: [
            { offset: 0, color: `${accentColor}30` },
            { offset: 1, color: '#00000000' },
          ],
        })}
        x={0}
        y={-100}
        opacity={0}
      />

      {/* Main card */}
      <Rect
        ref={containerRef}
        width={860}
        height={460}
        radius={24}
        fill={new Gradient({
          type: 'linear',
          from: [0, -230],
          to: [0, 230],
          stops: [
            { offset: 0, color: '#12141e' },
            { offset: 1, color: '#0a0b12' },
          ],
        })}
        stroke={'#1e2030'}
        lineWidth={1.5}
        shadowColor={'#00000080'}
        shadowBlur={60}
        shadowOffset={[0, 20]}
        scale={0.85}
        opacity={0}
      >
        {/* Top accent bar */}
        <Rect
          ref={barRef}
          width={0}
          height={3}
          radius={2}
          fill={accentColor}
          y={-228}
        />

        {/* NEXUS SIGNAL label */}
        <Txt
          ref={titleRef}
          text={'NEXUS SIGNAL'}
          fontSize={13}
          fontFamily={'Inter, system-ui, sans-serif'}
          fontWeight={700}
          fill={'#4a4a6a'}
          letterSpacing={4}
          y={-185}
        />

        {/* Coin name */}
        <Txt
          ref={coinRef}
          text={coin()}
          fontSize={88}
          fontFamily={'Inter, system-ui, sans-serif'}
          fontWeight={800}
          fill={'#ffffff'}
          y={-90}
          opacity={0}
        />

        {/* Action badge */}
        <Rect
          ref={actionBadgeRef}
          width={140}
          height={44}
          radius={22}
          fill={`${accentColor}25`}
          stroke={accentColor}
          lineWidth={1.5}
          y={10}
          scale={0}
        >
          <Txt
            ref={actionTextRef}
            text={action().toUpperCase()}
            fontSize={18}
            fontFamily={'Inter, system-ui, sans-serif'}
            fontWeight={800}
            fill={accentColor}
            letterSpacing={3}
          />
        </Rect>

        {/* Price */}
        <Txt
          ref={priceRef}
          text={`Entry: ${price()}`}
          fontSize={22}
          fontFamily={'Inter, system-ui, sans-serif'}
          fontWeight={500}
          fill={'#a0a0c0'}
          y={75}
          opacity={0}
        />

        {/* Target */}
        <Txt
          ref={targetRef}
          text={`Target: ${target()}  ·  ${timeWindow()}`}
          fontSize={18}
          fontFamily={'Inter, system-ui, sans-serif'}
          fontWeight={400}
          fill={'#606080'}
          y={110}
          opacity={0}
        />

        {/* Reason */}
        <Txt
          ref={reasonRef}
          text={reason()}
          fontSize={15}
          fontFamily={'Inter, system-ui, sans-serif'}
          fontWeight={400}
          fill={'#404060'}
          y={160}
          opacity={0}
        />
      </Rect>
    </>
  );

  // ── Animate in ──
  yield* all(
    containerRef().opacity(1, 0.5, easeOutCubic),
    containerRef().scale(1, 0.5, easeOutCubic),
    glowRef().opacity(1, 0.8),
  );

  yield* barRef().width(860, 0.6, easeOutCubic);

  yield* all(
    coinRef().opacity(1, 0.4, easeOutCubic),
    actionBadgeRef().scale(1, 0.4, easeOutCubic),
  );

  yield* all(
    priceRef().opacity(1, 0.3),
    targetRef().opacity(1, 0.3),
  );

  yield* reasonRef().opacity(1, 0.4);

  // Hold
  yield* waitFor(3);

  // ── Outro ──
  yield* all(
    containerRef().opacity(0, 0.4),
    glowRef().opacity(0, 0.4),
  );
});
