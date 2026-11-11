import type { Question } from "../types";

// Original questions written for Talent Incarnation. Ids are permanent.
export const uiUx: Question[] = [
  // Difficulty 1
  {
    id: "ux-001", domain: "ui-ux", topic: "Design fundamentals", difficulty: 1,
    prompt: "What is a wireframe?",
    options: [
      "The final visual design with colours and images",
      "A simple layout sketch that shows structure without visual detail",
      "The code that runs the interface",
      "A report of user complaints",
    ],
    correct: 1,
    explanation: "A wireframe shows what goes where. Leaving out colour and imagery keeps early feedback focused on structure.",
  },
  {
    id: "ux-002", domain: "ui-ux", topic: "Design fundamentals", difficulty: 1,
    prompt: "What is the main job of white space in a layout?",
    options: [
      "To separate and group content so it is easier to read",
      "To use up unused screen area",
      "To make pages load faster",
      "To hide content from users",
    ],
    correct: 0,
    explanation: "Space shows which items belong together and gives the eye room, which improves scanning and reading.",
  },
  {
    id: "ux-003", domain: "ui-ux", topic: "Usability", difficulty: 1,
    prompt: "Why is \"Save changes\" a better button label than \"OK\"?",
    options: [
      "It is longer, so it is easier to tap",
      "It uses more formal language",
      "It tells the user what will happen when they press it",
      "It looks more modern",
    ],
    correct: 2,
    explanation: "A specific label describes the action, so people can act without reading the surrounding text.",
  },
  {
    id: "ux-004", domain: "ui-ux", topic: "Accessibility", difficulty: 1,
    prompt: "Who primarily benefits from alternative (alt) text on an image?",
    options: [
      "Designers reviewing the layout",
      "Users on fast connections",
      "Search engines only",
      "People using screen readers, and anyone for whom the image does not load",
    ],
    correct: 3,
    explanation: "Screen readers announce alt text in place of the image, and browsers show it when the image fails to load.",
  },
  {
    id: "ux-005", domain: "ui-ux", topic: "User research", difficulty: 1,
    prompt: "What is a user persona?",
    options: [
      "A real customer's login account",
      "A fictional but research-based profile representing a group of users",
      "The designer's personal preference",
      "A list of product features",
    ],
    correct: 1,
    explanation: "A persona summarises the goals and behaviours of a user group found in research, giving the team a shared reference.",
  },
  {
    id: "ux-006", domain: "ui-ux", topic: "Interaction design", difficulty: 1,
    prompt: "What is the main reason to build a prototype?",
    options: [
      "To test an idea with people before investing in building it properly",
      "To replace the final product",
      "To write the documentation",
      "To choose the company logo",
    ],
    correct: 0,
    explanation: "A prototype is a cheap way to learn whether an idea works, while changes still cost little.",
  },

  // Difficulty 2
  {
    id: "ux-007", domain: "ui-ux", topic: "Design fundamentals", difficulty: 2,
    prompt: "What does \"visual hierarchy\" mean?",
    options: [
      "Placing the company logo at the top",
      "Using as many colours as possible",
      "Arranging elements so their relative importance is clear at a glance",
      "Sorting menu items alphabetically",
    ],
    correct: 2,
    explanation: "Size, weight, colour and position signal what to look at first, second and third.",
  },
  {
    id: "ux-008", domain: "ui-ux", topic: "Usability", difficulty: 2,
    prompt: "A user submits a form and nothing visibly changes for five seconds. Which usability principle is being violated?",
    options: [
      "Aesthetic and minimalist design",
      "Consistency and standards",
      "Flexibility and efficiency of use",
      "Visibility of system status",
    ],
    correct: 3,
    explanation: "The interface should always show what is happening. Without feedback, people assume it failed and submit again.",
  },
  {
    id: "ux-009", domain: "ui-ux", topic: "User research", difficulty: 2,
    prompt: "Analytics show that many users abandon the checkout on the payment step. Which method best reveals why?",
    options: [
      "Looking at more analytics dashboards",
      "Watching users attempt the checkout in usability tests",
      "Changing the button colour",
      "Asking the development team",
    ],
    correct: 1,
    explanation: "Analytics show where people drop off. Observing real attempts shows what confuses or stops them.",
  },
  {
    id: "ux-010", domain: "ui-ux", topic: "Accessibility", difficulty: 2,
    prompt: "Why should an error state not be shown with red colour alone?",
    options: [
      "People with colour-vision deficiencies may not perceive it, so text or an icon is also needed",
      "Red is an unlucky colour in some cultures",
      "Red uses more battery",
      "Screen sizes vary too much",
    ],
    correct: 0,
    explanation: "Information carried only by colour is lost to many users. Pairing it with text or an icon makes it reach everyone.",
  },
  {
    id: "ux-011", domain: "ui-ux", topic: "Interaction design", difficulty: 2,
    prompt: "What does a card-sorting study help you design?",
    options: [
      "The colour palette",
      "The loading animations",
      "The navigation and grouping of content",
      "The pricing",
    ],
    correct: 2,
    explanation: "Participants group topics in ways that make sense to them, which informs the information architecture and menu labels.",
  },
  {
    id: "ux-012", domain: "ui-ux", topic: "Design systems", difficulty: 2,
    prompt: "What is the main benefit of a design system?",
    options: [
      "It removes the need for user research",
      "It makes every product look different",
      "It guarantees a product will be successful",
      "It provides shared, reusable components and rules that keep products consistent",
    ],
    correct: 3,
    explanation: "Shared components and guidelines mean teams build faster and users meet the same patterns everywhere.",
  },

  // Difficulty 3
  {
    id: "ux-013", domain: "ui-ux", topic: "Usability", difficulty: 3,
    prompt: "What does Fitts's law imply for interface design?",
    options: [
      "Users read in an F-shaped pattern",
      "Targets that are larger and closer are faster to reach, so primary actions should be big and nearby",
      "Interfaces should have at most seven items",
      "Users prefer familiar designs",
    ],
    correct: 1,
    explanation: "Fitts's law relates the time to reach a target to its distance and size. Small, distant controls are slow and error-prone.",
  },
  {
    id: "ux-014", domain: "ui-ux", topic: "Usability", difficulty: 3,
    prompt: "According to Hick's law, what happens as the number of choices presented increases?",
    options: [
      "The time needed to decide increases",
      "Users become more satisfied",
      "Error rates always fall",
      "Reading speed increases",
    ],
    correct: 0,
    explanation: "Decision time grows with the number of options, which is why long menus are grouped or revealed progressively.",
  },
  {
    id: "ux-015", domain: "ui-ux", topic: "Accessibility", difficulty: 3,
    prompt: "What minimum contrast ratio does WCAG level AA require for normal-size body text?",
    options: ["2:1", "3:1", "4.5:1", "7:1"],
    correct: 2,
    explanation: "AA requires 4.5:1 for normal text and 3:1 for large text. 7:1 is the stricter AAA level.",
  },
  {
    id: "ux-016", domain: "ui-ux", topic: "User research", difficulty: 3,
    prompt: "For one round of qualitative usability testing, what is the commonly cited number of participants needed to surface most major problems?",
    options: ["1", "About 50", "At least 200", "About 5"],
    correct: 3,
    explanation: "Small rounds of around five participants find most of the serious issues. Running several small rounds beats one large one.",
  },
  {
    id: "ux-017", domain: "ui-ux", topic: "Interaction design", difficulty: 3,
    prompt: "Which pattern is most appropriate for a destructive action such as deleting an account?",
    options: [
      "Perform it immediately on a single tap",
      "Ask for confirmation that states the consequences, or offer a way to undo",
      "Hide the option so that nobody can find it",
      "Show a generic \"Are you sure?\" with OK preselected",
    ],
    correct: 1,
    explanation: "Irreversible actions need error prevention. A specific confirmation or an undo protects users from slips without blocking the task.",
  },
  {
    id: "ux-018", domain: "ui-ux", topic: "Design fundamentals", difficulty: 3,
    prompt: "What does the Gestalt principle of proximity state?",
    options: [
      "Elements placed close together are perceived as belonging to a group",
      "Bright elements are noticed first",
      "People prefer symmetrical layouts",
      "Moving elements attract attention",
    ],
    correct: 0,
    explanation: "Nearness signals a relationship, which is why a label should sit closer to its own field than to the next one.",
  },

  // Difficulty 4
  {
    id: "ux-019", domain: "ui-ux", topic: "Accessibility", difficulty: 4,
    prompt: "A custom dropdown built from div elements works with a mouse but not with a keyboard. What does it need at minimum?",
    options: [
      "A larger font",
      "A brighter colour on hover",
      "Focusability, keyboard event handling and appropriate ARIA roles and states, or a native select element instead",
      "A tooltip explaining how to use a mouse",
    ],
    correct: 2,
    explanation: "Native controls come with focus, keyboard behaviour and semantics. A custom control must recreate all three to be usable.",
  },
  {
    id: "ux-020", domain: "ui-ux", topic: "User research", difficulty: 4,
    prompt: "An A/B test shows that variant B increases sign-up clicks, but 30-day retention falls. What is the best interpretation?",
    options: [
      "B is the clear winner because clicks went up",
      "The test must be broken",
      "Retention is unrelated to design",
      "B improved a proxy metric at the expense of the real goal, so it should be judged on retention",
    ],
    correct: 3,
    explanation: "Clicks are a proxy. A change that attracts sign-ups who quickly leave has not improved the outcome the product cares about.",
  },
  {
    id: "ux-021", domain: "ui-ux", topic: "User research", difficulty: 4,
    prompt: "Why is \"Would you use a feature that does X?\" a weak interview question?",
    options: [
      "It is too short",
      "People are poor at predicting their own future behaviour; asking about past behaviour is more reliable",
      "It can only be answered by experts",
      "It is impolite",
    ],
    correct: 1,
    explanation: "Hypothetical answers tend towards a polite \"yes\". What someone did the last time they faced the problem is much stronger evidence.",
  },
  {
    id: "ux-022", domain: "ui-ux", topic: "Interaction design", difficulty: 4,
    prompt: "A mobile sign-up form with 12 fields has a high drop-off rate. Which change is most likely to help first?",
    options: [
      "Removing every field that is not needed to complete the task",
      "Making the submit button a brighter colour",
      "Adding an introductory animation",
      "Reducing the font size so everything fits on one screen",
    ],
    correct: 0,
    explanation: "Each extra field adds effort. Cutting the fields that are not essential usually reduces abandonment more than styling changes.",
  },
  {
    id: "ux-023", domain: "ui-ux", topic: "Usability", difficulty: 4,
    prompt: "What is the main problem with using placeholder text as the only label for a form field?",
    options: [
      "Placeholders cannot contain numbers",
      "It makes the form longer",
      "The label disappears once the user types, and it is often low-contrast and poorly announced by assistive technology",
      "Browsers do not support placeholders",
    ],
    correct: 2,
    explanation: "Once the placeholder is gone, users must remember what the field was for. A visible, persistent label avoids this.",
  },
  {
    id: "ux-024", domain: "ui-ux", topic: "Design systems", difficulty: 4,
    prompt: "What are design tokens?",
    options: [
      "Licences for design software",
      "Icons used in a navigation bar",
      "Rewards given to users for completing tasks",
      "Named values for decisions such as colour, spacing and type that act as a single source of truth",
    ],
    correct: 3,
    explanation: "Tokens store design decisions by name, so that design tools and code on every platform read the same values.",
  },

  // Difficulty 5
  {
    id: "ux-025", domain: "ui-ux", topic: "Accessibility", difficulty: 5,
    prompt: "When a modal dialog opens, what is the correct focus behaviour?",
    options: [
      "Leave focus where it was on the page behind the dialog",
      "Move focus into the dialog, keep it there while open, and return it to the triggering control on close",
      "Move focus to the browser's address bar",
      "Remove focus from the page entirely",
    ],
    correct: 1,
    explanation: "Keyboard and screen-reader users must land in the dialog, must not tab into the page behind it, and should return to where they were.",
  },
  {
    id: "ux-026", domain: "ui-ux", topic: "User research", difficulty: 5,
    prompt: "A product receives a System Usability Scale (SUS) score of 68. How should that be read?",
    options: [
      "It is roughly average usability; SUS scores are not percentages",
      "68% of users completed their tasks",
      "It is an excellent, top-tier result",
      "68% of users were satisfied",
    ],
    correct: 0,
    explanation: "SUS produces a 0–100 score that is not a percentage. The average across many studies is about 68.",
  },
  {
    id: "ux-027", domain: "ui-ux", topic: "User research", difficulty: 5,
    prompt: "A survey reports 90% satisfaction with a checkout flow, but it was shown only to people who completed a purchase. What is the flaw?",
    options: [
      "The sample is too satisfied",
      "The survey has too few questions",
      "Selection (survivorship) bias: people who gave up were never asked",
      "Satisfaction cannot be measured with surveys",
    ],
    correct: 2,
    explanation: "The people most likely to be dissatisfied, those who abandoned the flow, are missing from the sample.",
  },
  {
    id: "ux-028", domain: "ui-ux", topic: "Interaction design", difficulty: 5,
    prompt: "Large page-transition animations make a user with a vestibular disorder feel unwell. What is the right fix?",
    options: [
      "Add a warning before each animation",
      "Make the animations faster",
      "Ask the user to switch devices",
      "Honour the reduced-motion preference and replace large motion with minimal or no animation",
    ],
    correct: 3,
    explanation: "Operating systems expose a reduced-motion setting, and interfaces can respect it with the prefers-reduced-motion media query.",
  },
  {
    id: "ux-029", domain: "ui-ux", topic: "Usability", difficulty: 5,
    prompt: "A checkout pre-ticks a box that adds paid insurance to the order. Why is this considered a deceptive pattern rather than a helpful default?",
    options: [
      "Checkboxes are outdated controls",
      "It benefits the business by exploiting inattention, without the user's informed choice",
      "Defaults are never acceptable in forms",
      "It slows down the page",
    ],
    correct: 1,
    explanation: "A good default serves what most users want. This one adds a cost that users did not ask for and relies on them not noticing.",
  },
  {
    id: "ux-030", domain: "ui-ux", topic: "Design systems", difficulty: 5,
    prompt: "A team must change the primary button colour across 40 screens on three platforms. Which setup makes this a single change?",
    options: [
      "Components that read a semantic token, such as an \"action primary\" colour, which points to a palette value",
      "A style guide PDF listing the hex value",
      "Hard-coded hex values documented in a spreadsheet",
      "Separate colour definitions per screen",
    ],
    correct: 0,
    explanation: "When components reference a semantic token, changing what that token points to updates every screen and platform at once.",
  },
];
