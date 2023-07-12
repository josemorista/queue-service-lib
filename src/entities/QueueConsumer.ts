type HandleMessageFn<MessageType> = (message: MessageType) => Promise<void>;
interface QueueConsumerOptions {
  requeueOnError: boolean;
}

export abstract class QueueConsumer<MessageType> {
  protected queue: string;
  protected handler: HandleMessageFn<MessageType>;
  protected options: QueueConsumerOptions;

  constructor({
    queue,
    handler,
    options = {
      requeueOnError: false,
    },
  }: {
    queue: string;
    handler: HandleMessageFn<MessageType>;
    options?: QueueConsumerOptions;
  }) {
    this.handler = handler;
    this.queue = queue;
    this.options = options;
  }

  abstract consume(): Promise<void>;
  abstract stop(): void;
}
