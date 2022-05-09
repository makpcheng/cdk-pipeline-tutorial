import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep } from "@aws-cdk/pipelines";
import { CdkpipelinesDemoStage } from './cdkpipelines-demo-stage';
import { ShellScriptAction } from '@aws-cdk/pipelines';


/**
 * The stack that defines the application pipeline
 */
export class CdkpipelinesDemoPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      // The pipeline name
      pipelineName: 'MyServicePipeline',

       // How it will be built and synthesized
       synth: new ShellStep('Synth', {
         // Where the source can be found
         input: CodePipelineSource.gitHub('makpcheng/cdk-pipeline-tutorial', 'master'),
         
         // Install dependencies, build and run cdk synth
         commands: [
           'npm ci',
           'npm run build',
           'npx cdk synth'
         ],
       }),
    });

    // This is where we add the application stages
    // ...

    const preprod = new CdkpipelinesDemoStage(this, 'PreProd', {
	env:  { account: '678889463885', region: 'us-west-2' }
    });

    const preprodStage = pipeline.addStage(preprod, {
    post: [
      new ShellStep('TestService', {
        commands: [
          // Use 'curl' to GET the given URL and fail if it returns an error
          'curl -Ssf $ENDPOINT_URL',
        ],
        envFromCfnOutputs: {
          // Get the stack Output from the Stage and make it available in
          // the shell script as $ENDPOINT_URL.
          ENDPOINT_URL: preprod.urlOutput,
        },
      }),

    ],
  });
  }
}
