import { SQS, SQSClientConfig as ClientConfig } from '@aws-sdk/client-sqs';
import { SNS } from '@aws-sdk/client-sns';
import { PublishToQueueInput, PublishToTopicInput, QueuePublisher } from '../../../entities/QueuePublisher';

export class SqsQueuePublisher implements QueuePublisher {
  private sqs: SQS;
  private sns: SNS;

  constructor(config: ClientConfig) {
    this.sqs = new SQS(config);
    this.sns = new SNS(config);
  }

  private parseMessage(message: unknown) {
    return typeof message === 'string' ? message : JSON.stringify(message);
  }

  async publishToTopic(input: PublishToTopicInput): Promise<void> {
    await this.sns.publish({
      Message: this.parseMessage(input.message),
      TopicArn: input.topic,
      MessageAttributes: {
        RoutingKey: {
          DataType: 'String',
          StringValue: input.routingKey,
        },
      },
    });
  }

  async publishToQueue(input: PublishToQueueInput): Promise<void> {
    await this.sqs.sendMessage({
      MessageBody: this.parseMessage(input.message),
      QueueUrl: input.queue,
    });
  }

  async close() {
    this.sqs.destroy();
    this.sns.destroy();
  }
}
