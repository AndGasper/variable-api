#!/usr/bin/env node

import { Stack, App, StackProps } from '@aws-cdk/cdk';
import { NamedApi } from './stacks/constructs/api';


class Api extends Stack {
    constructor(parent: App, name: string, props: StackProps) {
        super(parent, name, props);
        new NamedApi(this, 'NamedApi', {
            domainName: this.node.getContext('domain'),
            apiPrefix: this.node.getContext('subdomain').apiPrefix
        });
    }
}

const app = new App();

new Api(app, 'ApiMk2', { env: { region: 'us-east-1' } });