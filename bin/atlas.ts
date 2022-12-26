#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AtlasStack } from '../lib/atlas-stack';
import {NetworkStack} from "../lib/atlas-network-stack";
import {DatabaseStack} from "../lib/atlas-database-stack";

const app = new cdk.App();
const acct = "460023120802";
const region = "us-east-1";
const dbuser = "atlassian"

const network = new NetworkStack(app, "NetworkStack", {
    cidr: "10.0.0.0/20",
    env: {
        account: acct,
        region: region
    }
})
const application = new AtlasStack(app, 'AtlasStack', {vpc: network.vpc, keyName: "jjkeynow", env: { account: `${acct}`, region: `${region}`} });
const database = new DatabaseStack(app, "AtlasDB", {vpc: network.vpc, atlasPet: application.ec2, databaseUser: dbuser, env: {
    account: acct, region: region
    }})

//wait for the network
application.addDependency(network)
database.addDependency(application)