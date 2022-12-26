import { Stack, StackProps, aws_ec2} from "aws-cdk-lib";
import { Construct} from "constructs";

interface NetworkProps extends StackProps{
    cidr: string
}

export class NetworkStack extends Stack{
    public readonly vpc: aws_ec2.Vpc;


    constructor(scope: Construct, id: string, props: NetworkProps) {
        super(scope, id, props)

        const vpc2 = aws_ec2.Vpc.fromLookup(this, 'og-vpc', {
            vpcName: 'vpc-4ab36432'
        })
        console.log('vpcId', vpc2.vpcId)
        console.log('cidrBlock', vpc2.vpcCidrBlock)
        this.vpc = new aws_ec2.Vpc(this, "AtlasVpc",{
            vpcName: "AtlasVpc",
            maxAzs: 2,
            cidr: props.cidr, subnetConfiguration: [
                {
                    name: "AtlasPubSub",
                    cidrMask: 24,
                    subnetType: aws_ec2.SubnetType.PUBLIC
                },
                {
                    name: "AtlasPrivSub",
                    cidrMask: 24,
                    subnetType: aws_ec2.SubnetType.PRIVATE_WITH_NAT
                },
                {
                    name: "AtlasPrivIso",
                    cidrMask: 24,
                    subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED
                }
            ]
        })


    }
}