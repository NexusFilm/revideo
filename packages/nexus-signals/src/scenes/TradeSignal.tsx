/**
 * Nexus Investment Group — Trade Signal Scene
 * Uses: Gradient fills, shadows, blur filters, blend modes, springs, skew
 */
import {
  Circle,
  Gradient,
  Layout,
  Node,
  Rect,
  Txt,
  blur,
  makeScene2D,
} from '@revideo/2d';
import {
  PlopSpring,
  SmoothSpring,
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutBack,
  easeOutExpo,
  linear,
  spring,
  tween,
  waitFor,
} from '@revideo/core';

const GOLD = '#C9A84C';
const GOLD_DIM = '#7B4F00';
const DARK = '#080808';
const DARKER = '#030303';
const GREEN = '#00d4a0';
const GREEN_DIM = '#003d2e';
const RED = '#ff4560';
const RED_DIM = '#4a0010';
const WHITE = '#ffffff';

export interface TradeSignalProps {
  action: 'BUY' | 'SELL';
  coin: string;
  amount: string;
  reason: string;
}

export default makeScene2D('trade-signal', function* (view) {
  // --- Signals ---
  const props: TradeSignalProps = {
    action: 'BUY',
    coin: 'BTC',
    amount: '$20 USD',
    reason: 'BTC breaking key resistance — macro risk-on signal confirmed. Allocation aligns with wave surfer protocol.',
  };

  const color = props.action === 'BUY' ? GREEN : RED;
  const colorDim = props.action === 'BUY' ? GREEN_DIM : RED_DIM;

  // Animated signals
  const bgOpacity = createSignal(0);
  const gridOpacity = createSignal(0);
  const glowOpacity = createSignal(0);
  const chipScale = createSignal(0);
  const coinY = createSignal(80);
  const coinOpacity = createSignal(0);
  const amountOpacity = createSignal(0);
  const cardY = createSignal(40);
  const cardOpacity = createSignal(0);
  const watermarkOpacity = createSignal(0);
  const pulseScale = createSignal(1);
  const pulseOpacity = createSignal(0);
  const outerOpacity = createSignal(1);

  // Refs
  const chipRef = createRef<Rect>();
  const coinRef = createRef<Txt>();
  const cardRef = createRef<Rect>();
  const glowRef = createRef<Circle>();
  const pulseRef = createRef<Circle>();

  // ── Scene Graph ──────────────────────────────────────────────
  view.add(
    <>
      {/* Background */}
      <Rect
        width={1920} height={1080}
        fill={DARKER}
        opacity={bgOpacity}
      />

      {/* Subtle grid */}
      <Rect
        width={1920} height={1080}
        fill={new Gradient({
          type: 'linear',
          from: [0, -540],
          to: [0, 540],
          stops: [
            { offset: 0,   color: `${color}08` },
            { offset: 0.5, color: `${color}04` },
            { offset: 1,   color: `${color}00` },
          ],
        })}
        opacity={gridOpacity}
      />

      {/* Center glow bloom — blur filter */}
      <Circle
        ref={glowRef}
        size={500}
        fill={color}
        opacity={glowOpacity}
        filters={[blur(120)]}
        compositeOperation="screen"
      />

      {/* Pulse ring */}
      <Circle
        ref={pulseRef}
        size={320}
        fill={null}
        stroke={color}
        lineWidth={2}
        opacity={pulseOpacity}
        scale={pulseScale}
      />

      {/* Main card — gradient border + shadow */}
      <Node
        cache={true}
        shadowColor={color}
        shadowBlur={60}
        shadowOffset={[0, 0]}
        opacity={cardOpacity}
        y={cardY}
      >
        <Rect
          ref={cardRef}
          width={860}
          height={480}
          radius={24}
          fill={new Gradient({
            type: 'linear',
            from: [0, -240],
            to: [0, 240],
            stops: [
              { offset: 0,   color: '#141414' },
              { offset: 1,   color: '#0a0a0a' },
            ],
          })}
          stroke={new Gradient({
            type: 'linear',
            from: [-430, 0],
            to: [430, 0],
            stops: [
              { offset: 0,   color: `${color}00` },
              { offset: 0.5, color: `${color}88` },
              { offset: 1,   color: `${color}00` },
            ],
          })}
          lineWidth={1}
        />
      </Node>

      {/* Action chip */}
      <Rect
        ref={chipRef}
        fill={new Gradient({
          type: 'linear',
          from: [0, -22],
          to: [0, 22],
          stops: [
            { offset: 0, color: color },
            { offset: 1, color: colorDim },
          ],
        })}
        shadowColor={color}
        shadowBlur={30}
        shadowOffset={[0, 4]}
        radius={999}
        paddingLeft={52} paddingRight={52}
        paddingTop={16} paddingBottom={16}
        scale={chipScale}
        y={-170}
      >
        <Txt
          fill={'#000000'}
          fontSize={26}
          fontWeight={900}
          letterSpacing={3}
          text={props.action}
        />
      </Rect>

      {/* Coin name */}
      <Txt
        ref={coinRef}
        fill={new Gradient({
          type: 'linear',
          from: [0, -60],
          to: [0, 60],
          stops: [
            { offset: 0, color: WHITE },
            { offset: 1, color: '#888888' },
          ],
        })}
        fontSize={110}
        fontWeight={900}
        y={coinY}
        opacity={coinOpacity}
        shadowColor={color}
        shadowBlur={20}
        shadowOffset={[0, 2]}
        text={props.coin}
      />

      {/* Amount */}
      <Txt
        fill={new Gradient({
          type: 'linear',
          from: [-100, 0],
          to: [100, 0],
          stops: [
            { offset: 0, color: GOLD_DIM },
            { offset: 0.5, color: GOLD },
            { offset: 1, color: GOLD_DIM },
          ],
        })}
        fontSize={44}
        fontWeight={700}
        y={80}
        opacity={amountOpacity}
        text={props.amount}
      />

      {/* Reason card */}
      <Node
        cache={true}
        shadowColor={'#000000'}
        shadowBlur={40}
        shadowOffset={[0, 8]}
        opacity={cardOpacity}
        y={cardY}
      >
        <Rect
          radius={16}
          fill={'#0f0f0f'}
          stroke={`${color}22`}
          lineWidth={1}
          width={780}
          paddingLeft={40} paddingRight={40}
          paddingTop={28} paddingBottom={28}
          y={230}
        >
          <Layout direction={'column'} gap={12} alignItems={'center'}>
            <Txt
              fill={color}
              fontSize={10}
              fontWeight={700}
              letterSpacing={2}
              text={'WHY THIS TRADE'}
            />
            <Txt
              fill={'#888888'}
              fontSize={20}
              lineHeight={32}
              textWrap={true}
              textAlign={'center'}
              maxWidth={700}
              text={props.reason}
            />
          </Layout>
        </Rect>
      </Node>

      {/* Watermark */}
      <Txt
        fill={'#222222'}
        fontSize={12}
        fontWeight={700}
        letterSpacing={3}
        y={490}
        opacity={watermarkOpacity}
        text={'NEXUS INVESTMENT GROUP'}
      />
    </>
  );

  // ── Animation Timeline ───────────────────────────────────────
  // 1. Fade in background
  yield* tween(0.4, v => {
    bgOpacity(easeInOutCubic(v));
    gridOpacity(easeInOutCubic(v));
  });

  // 2. Glow blooms in
  yield* tween(0.6, v => {
    glowOpacity(easeOutExpo(v, 0, 0.12));
  });

  // 3. Chip springs in + pulse starts
  yield* all(
    spring(PlopSpring, 0, 1, 1, v => chipScale(v)),
    tween(0.2, v => pulseOpacity(easeOutExpo(v, 0, 0.6))),
  );

  // 4. Pulse loop (3 pulses)
  yield* tween(0.3, v => {
    pulseScale(linear(v, 1, 1.8));
    pulseOpacity(linear(v, 0.6, 0));
  });
  pulseScale(1); pulseOpacity(0.6);
  yield* tween(0.3, v => {
    pulseScale(linear(v, 1, 1.8));
    pulseOpacity(linear(v, 0.6, 0));
  });

  // 5. Main card + coin enters
  yield* all(
    tween(0.5, v => {
      cardOpacity(easeOutExpo(v));
      cardY(easeOutBack(v, 40, 0));
    }),
    tween(0.5, v => {
      coinOpacity(easeOutExpo(v));
      coinY(easeOutBack(v, 80, 20));
    }),
  );

  // 6. Amount fades in
  yield* tween(0.35, v => {
    amountOpacity(easeOutExpo(v));
  });

  // 7. Watermark
  yield* tween(0.3, v => {
    watermarkOpacity(easeOutExpo(v));
  });

  // 8. Hold
  yield* waitFor(2.5);

  // 9. Fade out
  yield* tween(0.5, v => {
    outerOpacity(linear(v, 1, 0));
    view.opacity(linear(v, 1, 0));
  });
});
