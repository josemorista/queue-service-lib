export interface PublishToQueueInput {
  queue: string;
  message: unknown;
}

export interface PublishToTopicInput {
  topic: string;
  routingKey?: string;
  message: unknown;
}

export interface QueuePublisher {
  publishToQueue(input: PublishToQueueInput): Promise<void>;
  publishToTopic(input: PublishToTopicInput): Promise<void>;
  close(): Promise<void>;
}
