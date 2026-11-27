<script setup lang="ts">
// Пустой раздел: что в нём появится (docs/ROADMAP.md, «Админка»)
defineProps<{ title: string; text: string }>();
</script>

<template>
  <AdminPage :title="title">
    <UAlert color="neutral" variant="subtle" icon="i-lucide-hammer" title="Раздел пока пустой" :description="text" />
  </AdminPage>
</template>
