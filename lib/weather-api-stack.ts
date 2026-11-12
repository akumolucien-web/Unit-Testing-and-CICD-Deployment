import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import {
  CodePipeline,
  ShellStep,
  CodePipelineSource,
} from 'aws-cdk-lib/pipelines';
import { PipelineStage } from './pipeline-stage';

export class WeatherApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: new ShellStep('synth', {
        input: CodePipelineSource.gitHub(
          'akumolucien-web/Unit-Testing-and-CICD-Deployment',
          'main'
        ),
        // npm test fails the build, and so blocks the deploy, if any test fails.
        commands: ['npm ci', 'npm run build', 'npm test', 'npx cdk synth'],
      }),
    });

    /*********************************
     * Add dev stage
     *********************************/
    const devStage = pipeline.addStage(
      new PipelineStage(this, 'PipelineDevStage', {
        stageName: 'dev',
      })
    );

    /*********************************
     * Add prod stage
     *********************************/
    const prodStage = pipeline.addStage(
      new PipelineStage(this, 'PipelineProdStage', {
        stageName: 'prod',
      })
    );
  }
}
