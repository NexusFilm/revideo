import { makeProject } from '@revideo/core';
import scene from '../scenes/TradeSignal';

export default makeProject({
  scenes: [scene],
  variables: {
    action: 'BUY',
    coin: 'BTC',
    amount: '$20 USD',
    reason: 'BTC breaking key resistance — macro risk-on confirmed.',
  },
});
