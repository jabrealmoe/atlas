import { Stack, StackProps, aws_ec2} from "aws-cdk-lib";
import { Construct} from "constructs";

interface NetworkProps extends StackProps{
    cidr: string
}

export class NetworkStack extends Stack{
    public readonly vpc: aws_ec2.Vpc;


    constructor(scope: Construct, id: string, props: NetworkProps) {
        super(scope, id, props)


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