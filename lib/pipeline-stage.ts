import { LambdaStack } from "./lambda-stack";
import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    /***********************************
     * Instantiate the lambda stack
     ***********************************/
    new LambdaStack(this, "lambdaStack", {
      stageName: props?.stageName as string,
    });
  }
}
