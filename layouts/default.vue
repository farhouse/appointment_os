<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Barber OS</h1>
      <div class="space-x-2">
        <UButton to="/" variant="ghost">Home</UButton>
        <UButton to="/calendar" variant="ghost">Calendar</UButton>
        <UButton to="/bookings" variant="ghost">Bookings</UButton>
      </div>
    </div>
    <slot />
  </div>
</template>
