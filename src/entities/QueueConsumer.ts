type HandleMessageFn = (message: any) => Promise<void>;
interface QueueConsumerOptions {
  requeueOnError: boolean;
}

export abstract class QueueConsumer {
  protected queue: string;
  protected handler: HandleMessageFn;
  protected options: QueueConsumerOptions;

  constructor({
    queue,
    handler,
    options = {
      requeueOnError: false,
    },
  }: {
    queue: string;
    handler: HandleMessageFn;
    options?: QueueConsumerOptions;
  }) {
    this.handler = handler;
    this.queue = queue;
    this.options = options;
  }

  abstract consume(): Promise<void>;
  abstract stop(): void;
}
