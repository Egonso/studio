import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildProvisionedWorkspaceMember,
  buildScimProvisioningEnvelope,
  resolveProvisionedWorkspaceRole,
} from './provisioning';
import { createDefaultEnterpriseWorkspaceSettings } from './workspace';

test('provisioning resolves role mappings from configured groups', () => {
  const settings = createDefaultEnterpriseWorkspaceSettings();
  settings.identityProvider.roleMappings = [
    { groupName: 'security-admins', role: 'ADMIN' },
  ];
  settings.scim.defaultRole = 'MEMBER';

  assert.equal(
    resolveProvisionedWorkspaceRole({
      settings,
      groups: ['security-admins'],
    }),
    'ADMIN',
  );
});

test('scim provisioning envelope normalizes identity fields', () => {
  const settings = createDefaultEnterpriseWorkspaceSettings();
  settings.scim.defaultRole = 'REVIEWER';

  const envelope = buildScimProvisioningEnvelope({
    identity: {
      email: ' Reviewer@Example.com ',
      displayName: ' Reviewer User ',
      groups: [' reviewers ', 'reviewers'],
    },
    settings,
  });

  assert.equal(envelope.userName, 'reviewer@example.com');
  assert.equal(envelope.displayName, 'Reviewer User');
  assert.deepEqual(envelope.groups, ['reviewers']);
  assert.equal(envelope.role, 'REVIEWER');
});

test('provisioned members keep sync metadata and mapped groups', () => {
  const settings = createDefaultEnterpriseWorkspaceSettings();
  settings.scim.groupMappings = [{ groupName: 'external-officers', role: 'EXTERNAL_OFFICER' }];

  const member = buildProvisionedWorkspaceMember({
    identity: {
      email: 'officer@example.com',
      groups: ['external-officers'],
    },
    settings,
    userId: 'user_123',
  });

  assert.equal(member.role, 'EXTERNAL_OFFICER');
  assert.deepEqual(member.groups, ['external-officers']);
  assert.equal(member.source, 'scim');
});
