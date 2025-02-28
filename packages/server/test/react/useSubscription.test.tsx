import { getServerAndReactClient } from './__reactHelpers';
import { render, waitFor } from '@testing-library/react';
import { EventEmitter } from 'events';
import { konn } from 'konn';
import React, { useState } from 'react';
import { z } from 'zod';
import { initTRPC } from '../../src';
import { observable } from '../../src/observable';

const ee = new EventEmitter();

const ctx = konn()
  .beforeEach(() => {
    const t = initTRPC()({
      errorFormatter({ shape }) {
        return {
          ...shape,
          data: {
            ...shape.data,
            foo: 'bar' as const,
          },
        };
      },
    });
    const appRouter = t.router({
      onEvent: t.procedure.input(z.number()).subscription(({ input }) => {
        return observable<number>((emit) => {
          const onData = (data: number) => emit.next(data + input);
          ee.on('data', onData);
          return () => {
            ee.off('data', onData);
          };
        });
      }),
    });

    return getServerAndReactClient(appRouter);
  })
  .afterEach(async (ctx) => {
    await ctx?.close?.();
  })
  .done();

test('useSubscription', async () => {
  const onDataMock = jest.fn();
  const onErrorMock = jest.fn();

  const { App, proxy } = ctx;

  function MyComponent() {
    const [isStarted, setIsStarted] = useState(false);
    const [data, setData] = useState<number>();

    proxy.onEvent.useSubscription(10, {
      enabled: true,
      onStarted: () => setIsStarted(true),
      onData: (data) => {
        onDataMock(data);
        setData(data);
      },
      onError: onErrorMock,
    });

    if (!isStarted) {
      return <>{'__connecting'}</>;
    }

    if (!data) {
      return <>{'__connected'}</>;
    }

    return <pre>{`__data:${data}`}</pre>;
  }

  const utils = render(
    <App>
      <MyComponent />
    </App>,
  );

  await waitFor(() =>
    expect(utils.container).toHaveTextContent(`__connecting`),
  );
  expect(onDataMock).toHaveBeenCalledTimes(0);
  await waitFor(() => expect(utils.container).toHaveTextContent(`__connected`));
  ee.emit('data', 20);
  await waitFor(() => expect(utils.container).toHaveTextContent(`__data:30`));
  expect(onDataMock).toHaveBeenCalledTimes(1);
  expect(onErrorMock).toHaveBeenCalledTimes(0);
});
