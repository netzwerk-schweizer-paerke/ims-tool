'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { useAuth } from '@payloadcms/ui/providers/Auth';
import {
  EntityToGroup,
  EntityType,
  Group,
  groupNavItems,
} from '@payloadcms/ui/utilities/groupNavItems';
import { useConfig } from '@payloadcms/ui/providers/Config';
import { NavGroup } from '@payloadcms/ui/elements/NavGroup';
import { getTranslation } from '@payloadcms/translations';
import { Chevron } from '@payloadcms/ui/icons/Chevron';
import { Logout } from '@payloadcms/ui/elements/Logout';
import { Hamburger } from '@payloadcms/ui/elements/Hamburger';
import { useNav } from '@payloadcms/ui/dist/elements/Nav/context';

const baseClass = 'nav';

export const CustomNav: React.FC = () => {
  const { navOpen, navRef, setNavOpen } = useNav();
  const { permissions, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const { i18n } = useTranslation('general');

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks },
    },
    collections,
    globals,
    routes: { admin },
  } = useConfig();

  useEffect(() => {
    setGroups(
      groupNavItems(
        [
          ...collections
            .filter(
              ({ admin: { hidden } }) =>
                !(typeof hidden === 'function' ? hidden({ user }) : hidden),
            )
            .map((collection) => {
              const entityToGroup: EntityToGroup = {
                entity: collection,
                type: EntityType.collection,
              };

              return entityToGroup;
            }),
          ...globals
            .filter(
              ({ admin: { hidden } }) =>
                !(typeof hidden === 'function' ? hidden({ user }) : hidden),
            )
            .map((global) => {
              const entityToGroup: EntityToGroup = {
                entity: global,
                type: EntityType.global,
              };

              return entityToGroup;
            }),
        ],
        permissions,
        i18n,
      ),
    );
  }, [collections, globals, permissions, i18n, i18n.language, user]);

  return (
    <aside className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__scroll`} ref={navRef}>
        <nav className={`${baseClass}__wrap`}>
          {Array.isArray(beforeNavLinks) &&
            beforeNavLinks.map((Component, i) => <Component key={i} />)}
          {groups.map(({ entities, label }, key) => {
            return (
              <NavGroup {...{ key, label }}>
                {entities.map(({ entity, type }, i) => {
                  let entityLabel: string;
                  let href: string;
                  let id: string;

                  if (type === EntityType.collection) {
                    href = `${admin}/collections/${entity.slug}`;
                    entityLabel = getTranslation(entity.labels.plural, i18n);
                    id = `nav-${entity.slug}`;
                  }

                  if (type === EntityType.global) {
                    href = `${admin}/globals/${entity.slug}`;
                    entityLabel = getTranslation(entity.label, i18n);
                    id = `nav-global-${entity.slug}`;
                  }

                  return (
                    <NavLink
                      activeClassName="active"
                      className={`${baseClass}__link`}
                      id={id}
                      key={i}
                      tabIndex={!navOpen ? -1 : undefined}
                      to={href}>
                      <span className={`${baseClass}__link-icon`}>
                        <Chevron direction="right" />
                      </span>
                      <span className={`${baseClass}__link-label`}>{entityLabel}</span>
                    </NavLink>
                  );
                })}
              </NavGroup>
            );
          })}
          {Array.isArray(afterNavLinks) &&
            afterNavLinks.map((Component, i) => <Component key={i} />)}
          <div className={`${baseClass}__controls`}>
            <Logout tabIndex={!navOpen ? -1 : undefined} />
          </div>
        </nav>
      </div>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <button
            className={`${baseClass}__mobile-close`}
            onClick={() => {
              setNavOpen(false);
            }}
            tabIndex={!navOpen ? -1 : undefined}
            type="button">
            <Hamburger isActive />
          </button>
        </div>
      </div>
    </aside>
  );
};
