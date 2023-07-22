import { Message, SQS, SQSClientConfig } from '@aws-sdk/client-sqs';
import { QueueConsumer } from '../../../entities/QueueConsumer';

interface SQSQueueConsumerOptions extends SQSClientConfig {
  poolingDelay: number;
  requeueVisibility?: number;
  batchSize: number;
  longPoolingTimeout: number;
}

type MessageMetadata = { Id: string; ReceiptHandle: string };

export class SQSQueueConsumer extends QueueConsumer {
  private sqs: SQS;
  private isConsuming: boolean;

  constructor(
    consumerOptions: ConstructorParameters<typeof QueueConsumer>[0],
    private sqsConfig: SQSQueueConsumerOptions
  ) {
    super(consumerOptions);
    this.sqs = new SQS(sqsConfig);
    this.isConsuming = false;
  }

  stop() {
    this.isConsuming = false;
  }

  private delayPooling() {
    return new Promise((resolve) => setTimeout(resolve, this.sqsConfig.poolingDelay));
  }

  private parseMessage(message: Message) {
    if (!message.Body) return null;
    try {
      return JSON.parse(message.Body);
    } catch (error) {
      return message.Body;
    }
  }

  async consume(): Promise<void> {
    this.isConsuming = true;

    while (this.isConsuming) {
      const { Messages } = await this.sqs.receiveMessage({
        QueueUrl: this.queue,
        MaxNumberOfMessages: this.sqsConfig.batchSize,
        WaitTimeSeconds: this.sqsConfig.longPoolingTimeout,
      });

      if (Messages && Messages.length) {
        const requeueCandidates: Array<MessageMetadata & { VisibilityTimeout: number }> = [];
        const ackCandidates: Array<MessageMetadata> = [];

        await Promise.all(
          Messages.map(async (message) => {
            const messageMetadata = {
              Id: message.MessageId || '',
              ReceiptHandle: message.ReceiptHandle || '',
            };
            try {
              const parsedMessage = this.parseMessage(message);
              if (parsedMessage) await this.handler(parsedMessage);
              ackCandidates.push(messageMetadata);
            } catch (error) {
              if (error instanceof Error) {
                console.error(`[ERROR]:mId=${message.MessageId};rH=${message.ReceiptHandle}|${error.message}`);
              }
              if (this.options.requeueOnError) {
                requeueCandidates.push({
                  ...messageMetadata,
                  VisibilityTimeout: this.sqsConfig.requeueVisibility || 5,
                });
              } else {
                ackCandidates.push(messageMetadata);
              }
            }
          })
        );

        await this.sqs.deleteMessageBatch({
          Entries: ackCandidates,
          QueueUrl: this.queue,
        });

        if (this.options.requeueOnError) {
          await this.sqs.changeMessageVisibilityBatch({
            QueueUrl: this.queue,
            Entries: requeueCandidates,
          });
        }
      }

      await this.delayPooling();
    }
  }
}
