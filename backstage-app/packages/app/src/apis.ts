import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
  scmAuthApiRef,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import {
  githubActionsApiRef,
  GithubActionsClient,
} from '@backstage-community/plugin-github-actions';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: githubActionsApiRef,
    deps: { configApi: configApiRef, scmAuthApi: scmAuthApiRef },
    factory: ({ configApi, scmAuthApi }) =>
      new GithubActionsClient({ configApi, scmAuthApi }),
  }),
];
