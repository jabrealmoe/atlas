import {
    aws_ec2,
    aws_iam,
    Stack,
    StackProps,
    Aws,
    aws_route53,
    aws_certificatemanager,
    aws_cloudfront,
    RemovalPolicy, aws_route53_targets, aws_cloudwatch
} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Effect} from "aws-cdk-lib/aws-iam";
import * as certificatemgr from '@aws-cdk/aws-certificatemanager';
import * as fs from 'fs'
import * as route53 from '@aws-cdk/aws-route53';


interface ApplicationProps extends StackProps {
    keyName: string;
    vpc: aws_ec2.Vpc;
    domainName: string;
}

export class AtlasStack extends Stack {
    public readonly ec2: aws_ec2.Instance;
    constructor(scope: Construct, id: string, props: ApplicationProps) {
        super(scope, id, props);
        const sg = new aws_ec2.SecurityGroup(
            this,
            "Open888080",
            {
                securityGroupName: "Open8080 and 8090 and 80 and 22",
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
            volume: aws_ec2.BlockDeviceVolume.ebs(30), // Override the volume size in Gibibytes (GiB)
        };

        const coachZone = aws_route53.HostedZone.fromHostedZoneAttributes(this, "hosted-jj", {hostedZoneId: 'Z0419023BX863FBLBVNM', zoneName: 'atlassianfamily.com'})
        const certificateArn = new aws_certificatemanager.DnsValidatedCertificate(this, `atlassian-family-arn`, {
            domainName: props.domainName,
            hostedZone: coachZone,
            region: Aws.REGION
        }).certificateArn


        const viewcert = aws_cloudfront.ViewerCertificate.fromAcmCertificate({
            certificateArn,
            env: {
                region: Aws.REGION,
                account: Aws.ACCOUNT_ID,
            }, node: this.node,
            stack: this,
            applyRemovalPolicy(policy: RemovalPolicy): void { },
            metricDaysToExpiry: () => {
                return new aws_cloudwatch.Metric({
                    namespace: "cdk",
                    metricName: "cdk",
                })
            }
        }, {
            sslMethod: aws_cloudfront.SSLMethod.SNI,
            securityPolicy: aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            aliases: [props.domainName]
        })


        const distribution = new aws_cloudfront.CloudFrontWebDistribution(this, `atlassianfamily-distribution`, {

            originConfigs: [{
                customOriginSource: {
                    domainName: props.domainName,
                },
                behaviors: [
                    {

                        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        allowedMethods: aws_cloudfront.CloudFrontAllowedMethods.GET_HEAD,
                        compress: true,
                        isDefaultBehavior: true,
                    }
                ]
            }],
            viewerCertificate: viewcert,
            defaultRootObject: "index.html",
            errorConfigurations: [
                {
                    errorCode: 403,
                    responseCode: 200,
                    responsePagePath: "/index.html"
                }
            ]

        })
        new aws_route53.ARecord(this, `atlassian-family-arecord`, {
            recordName: props.domainName,

            zone: coachZone,
            target: aws_route53.RecordTarget.fromAlias(new aws_route53_targets.CloudFrontTarget(distribution))
        })


        this.ec2 = new aws_ec2.Instance(
            this, "AtlassianFamilyPetEc2", {
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
                    aws_ec2.InstanceSize.XLARGE2
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
