export default defineAppConfig({
  ui: {
    colors: {
      primary: 'barber',
      neutral: 'slate'
    },

    // Improve readability for vertical sidebar navigation (inactive items were too dim).
    navigationMenu: {
      variants: {
        active: {
          false: {
            link: 'text-gray-700 hover:text-gray-950',
            linkLeadingIcon: 'text-gray-500 group-hover:text-gray-700'
          }
        }
      }
    }
  }
})
