import {aws_ec2, aws_iam, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Effect} from "aws-cdk-lib/aws-iam";
import * as fs from 'fs'


interface ApplicationProps extends StackProps {
    keyName: string;
    vpc: aws_ec2.Vpc;
}

export class AtlasStack extends Stack {
    public readonly ec2: aws_ec2.Instance;
    constructor(scope: Construct, id: string, props: ApplicationProps) {
        super(scope, id, props);
        const sg = new aws_ec2.SecurityGroup(
            this,
            "Open888080",
            {
                securityGroupName: "Open808080",
                vpc: props.vpc
            }
        )
        sg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(80), "Open80 http")
        sg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(22), "Open22 for ssh")
        sg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(8080), "Open8080 for jira")
        sg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(8090), "Open8090 for confluence")

        const role = new aws_iam.Role(this, "Role to connect to Atlas", {
            roleName: "Ec2Atlas",
            assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com")
        })
        role.addManagedPolicy(aws_iam.ManagedPolicy.fromManagedPolicyArn(this, "SSMManagedPolicyForEC2", "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"))
        role.addToPolicy(
            new aws_iam.PolicyStatement({
                effect: Effect.ALLOW,
                resources: ["*"],
                actions: ["s3:*"]
            })
        )

        const rootVolume: aws_ec2.BlockDevice = {
            deviceName: '/dev/xvda', // Use the root device name from Step 1
            volume: aws_ec2.BlockDeviceVolume.ebs(50), // Override the volume size in Gibibytes (GiB)
        };
        this.ec2 = new aws_ec2.Instance(
            this, "FamilyAtlassianPetEC2", {
                instanceName: "AtlassianFamilyPetEc2",
                blockDevices: [rootVolume],
                vpc: props.vpc,
                role: role,
                securityGroup: sg,
                vpcSubnets: {
                    subnetType: aws_ec2.SubnetType.PUBLIC
                },
                instanceType: aws_ec2.InstanceType.of(
                    aws_ec2.InstanceClass.T2,
                    aws_ec2.InstanceSize.LARGE
                ),
                machineImage: new aws_ec2.AmazonLinuxImage({
                    generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
                    edition: aws_ec2.AmazonLinuxEdition.STANDARD
                }),
                allowAllOutbound: true
            }
        )

        this.ec2.addUserData(fs.readFileSync("./lib/deploy.sh", {encoding: "utf-8"}))


    }
}
