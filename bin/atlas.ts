#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AtlasStack } from '../lib/atlas-stack';

const app = new cdk.App();
new AtlasStack(app, 'AtlasStack');
