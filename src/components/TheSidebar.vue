<script setup>
import AppIcon from './AppIcon.vue'
import { brand } from '../lib/assets.js'
import {
  NAV, activeKeys, openChallenge, openKeys, shell, toggleGroup, toggleSidebar,
} from '../lib/portal.js'

const isOpen = (key) => openKeys.value.has(key)
const branchActive = (item) => item.children.some((child) => activeKeys.value.has(child.key))
const current = (key) => (activeKeys.value.has(key) ? 'page' : null)

function onParent(item) {
  if (shell.collapsed) {
    window.location.href = item.children[0].href
    return
  }
  toggleGroup(item.key)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'is-collapsed': shell.collapsed, 'is-open': shell.drawer }">
    <div class="sidebar__head">
      <a class="brand" href="#overview" aria-label="CK Propfirm — trader portal home">
        <img :src="brand.logo" alt="CK Propfirm" width="1095" height="198" />
      </a>
      <button
        class="sidebar__collapse"
        :aria-label="shell.collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="String(!shell.collapsed)"
        @click="toggleSidebar"
      >
        <span class="sidebar__toggle sidebar__toggle--collapse"><AppIcon name="chevronLeft" :size="16" /></span>
        <span class="sidebar__toggle sidebar__toggle--expand"><AppIcon name="chevronRight" :size="16" /></span>
      </button>
    </div>

    <div class="sidebar__scroll">
      <nav class="nav" aria-label="Primary">
        <div class="nav-groups">
          <div v-for="group in NAV" :key="group.label" class="nav-group">
            <div class="nav-group__label">{{ group.label }}</div>
            <ul>
              <li
                v-for="item in group.items"
                :key="item.key"
                class="nav-li"
                :class="{ 'is-open': item.children && isOpen(item.key) }"
              >
                <template v-if="item.children">
                  <button
                    type="button"
                    class="nav-item nav-item--parent"
                    :class="{ 'is-branch': branchActive(item) }"
                    :aria-expanded="isOpen(item.key)"
                    @click="onParent(item)"
                  >
                    <AppIcon :name="item.icon" :size="18" />
                    <span>{{ item.label }}</span>
                    <span class="nav-chevron"><AppIcon name="chevronDown" :size="15" /></span>
                  </button>
                  <ul class="nav-sub" :hidden="!isOpen(item.key)">
                    <li v-for="child in item.children" :key="child.key">
                      <a class="nav-subitem" :href="child.href" :aria-current="current(child.key)">
                        {{ child.label }}
                        <span v-if="child.badge" class="nav-badge">{{ child.badge() }}</span>
                      </a>
                    </li>
                  </ul>
                </template>

                <a v-else class="nav-item" :href="item.href" :aria-current="current(item.key)">
                  <AppIcon :name="item.icon" :size="18" />
                  <span>{{ item.label }}</span>
                  <span v-if="item.badge" class="nav-badge">{{ item.badge() }}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>

    <div class="sidebar__foot">
      <button type="button" class="nav-cta" data-od-id="start-challenge-cta" @click="openChallenge()">
        <AppIcon name="rocket" :size="18" />
        <span>Start New Challenge</span>
      </button>
    </div>
  </aside>
</template>
