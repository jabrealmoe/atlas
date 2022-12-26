import { Stack, StackProps, aws_ec2} from "aws-cdk-lib";
import { Construct} from "constructs";
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cdk from 'aws-cdk-lib';

interface DatabaseProps extends StackProps{
    databaseUser: string;
    vpc: aws_ec2.Vpc;
    atlasPet: aws_ec2.Instance;
}

export class DatabaseStack extends Stack{
    constructor(scope: Construct, id: string, props: DatabaseProps) {
        super(scope, id, props)

        const dbInstance = new rds.DatabaseInstance(this, 'atlas-pg-db', {
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
            },
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_13_8,
            }),
            instanceType: aws_ec2.InstanceType.of(
                aws_ec2.InstanceClass.BURSTABLE3,
                aws_ec2.InstanceSize.SMALL,
            ),
            credentials: rds.Credentials.fromGeneratedSecret(props.databaseUser),
            multiAz: false,

            allocatedStorage: 1000,
            maxAllocatedStorage: 1000,
            allowMajorVersionUpgrade: false,
            autoMinorVersionUpgrade: true,
            backupRetention: cdk.Duration.days(0),
            deleteAutomatedBackups: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            deletionProtection: false,
            databaseName: 'jira',
            publiclyAccessible: false,
        });

        dbInstance.connections.allowFrom(props.atlasPet, aws_ec2.Port.tcp(5432));

        new cdk.CfnOutput(this, 'dbEndpoint', {
            value: dbInstance.instanceEndpoint.hostname,
        });

        new cdk.CfnOutput(this, 'secretName', {
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            value: dbInstance.secret?.secretName!,
        });

    }
}