import type { Question } from "../types";

// Original questions written for Talent Incarnation. Ids are permanent.
export const dataAi: Question[] = [
  // Difficulty 1
  {
    id: "da-001", domain: "data-ai", topic: "Statistics", difficulty: 1,
    prompt: "What is the mean of 2, 4, 6 and 8?",
    options: ["4", "5", "6", "20"],
    correct: 1,
    explanation: "The mean is the sum divided by the count: 20 ÷ 4 = 5.",
  },
  {
    id: "da-002", domain: "data-ai", topic: "Data handling", difficulty: 1,
    prompt: "In a typical data table, what does each row represent?",
    options: [
      "One record or observation",
      "One measured property of the data",
      "The name of the dataset",
      "A formula",
    ],
    correct: 0,
    explanation: "Rows are individual records, such as one customer or one order. Columns hold the properties measured for each.",
  },
  {
    id: "da-003", domain: "data-ai", topic: "Machine learning", difficulty: 1,
    prompt: "What does supervised learning require that unsupervised learning does not?",
    options: [
      "A faster computer",
      "Images instead of numbers",
      "Examples that come with the correct answer (labels)",
      "An internet connection",
    ],
    correct: 2,
    explanation: "Supervised learning learns a mapping from inputs to known outputs, so each training example needs a label.",
  },
  {
    id: "da-004", domain: "data-ai", topic: "Statistics", difficulty: 1,
    prompt: "Which chart best shows how the values of one numeric variable are distributed?",
    options: ["Pie chart", "Line chart of two variables", "Network diagram", "Histogram"],
    correct: 3,
    explanation: "A histogram groups values into ranges and shows how many fall in each, revealing the shape of the distribution.",
  },
  {
    id: "da-005", domain: "data-ai", topic: "Data handling", difficulty: 1,
    prompt: "Some cells in a dataset column are empty. What are these called?",
    options: ["Outliers", "Missing values", "Duplicates", "Labels"],
    correct: 1,
    explanation: "Empty cells are missing values. They must be handled, for example by removing the rows or filling them in, before most analysis.",
  },
  {
    id: "da-006", domain: "data-ai", topic: "Machine learning", difficulty: 1,
    prompt: "Predicting the selling price of a house, a number, is what kind of task?",
    options: ["Regression", "Classification", "Clustering", "Translation"],
    correct: 0,
    explanation: "Regression predicts a continuous number. Classification predicts one of a fixed set of categories.",
  },

  // Difficulty 2
  {
    id: "da-007", domain: "data-ai", topic: "Statistics", difficulty: 2,
    prompt: "Which measure is least affected by a single extremely large value in the data?",
    options: ["Mean", "Range", "Median", "Sum"],
    correct: 2,
    explanation: "The median depends only on the middle value, so one extreme value barely moves it. The mean, range and sum all shift.",
  },
  {
    id: "da-008", domain: "data-ai", topic: "Model evaluation", difficulty: 2,
    prompt: "Why is data split into a training set and a test set?",
    options: [
      "To make training run faster",
      "To reduce the size of the file on disk",
      "To remove duplicate rows",
      "To estimate how well the model performs on data it has not seen",
    ],
    correct: 3,
    explanation: "A model can memorise its training data. Performance on held-out data shows whether it generalises.",
  },
  {
    id: "da-009", domain: "data-ai", topic: "Machine learning", difficulty: 2,
    prompt: "Deciding whether an email is spam or not spam is an example of what?",
    options: ["Regression", "Binary classification", "Dimensionality reduction", "Clustering"],
    correct: 1,
    explanation: "There are two possible categories and labelled examples, which makes it binary classification.",
  },
  {
    id: "da-010", domain: "data-ai", topic: "Data handling", difficulty: 2,
    prompt: "In SQL, which keyword combines rows from two tables based on a matching column?",
    options: ["JOIN", "UNION", "DISTINCT", "LIMIT"],
    correct: 0,
    explanation: "JOIN matches rows across tables on a condition. UNION stacks the results of two queries on top of each other.",
  },
  {
    id: "da-011", domain: "data-ai", topic: "Statistics", difficulty: 2,
    prompt: "Two variables have a correlation of −0.9. What does this tell you?",
    options: [
      "They are unrelated",
      "One causes the other to fall",
      "They have a strong linear relationship: as one rises, the other tends to fall",
      "90% of the data is negative",
    ],
    correct: 2,
    explanation: "A value near −1 means a strong negative linear association. Correlation alone does not establish causation.",
  },
  {
    id: "da-012", domain: "data-ai", topic: "Machine learning", difficulty: 2,
    prompt: "Grouping customers by how similar they are, without any predefined labels, is called what?",
    options: ["Classification", "Regression", "Reinforcement learning", "Clustering"],
    correct: 3,
    explanation: "Clustering is unsupervised: it finds groups in the data without being told what the groups are.",
  },

  // Difficulty 3
  {
    id: "da-013", domain: "data-ai", topic: "Model evaluation", difficulty: 3,
    prompt: "A model scores 99% accuracy on its training data and 70% on test data. What is the most likely problem?",
    options: ["Underfitting", "Overfitting", "Too little training time", "A broken test set"],
    correct: 1,
    explanation: "A large gap between training and test performance means the model has fitted noise in the training data: overfitting.",
  },
  {
    id: "da-014", domain: "data-ai", topic: "Model evaluation", difficulty: 3,
    prompt: "A disease affects 1% of patients. A model that predicts \"healthy\" for everyone has 99% accuracy. Which metric exposes that it is useless?",
    options: ["Recall for the disease class", "Training time", "Accuracy on a larger sample", "Number of features"],
    correct: 0,
    explanation: "Recall for the disease class is 0: the model finds none of the sick patients. Accuracy hides this when classes are imbalanced.",
  },
  {
    id: "da-015", domain: "data-ai", topic: "Statistics", difficulty: 3,
    prompt: "A hypothesis test returns a p-value of 0.03. What does that mean?",
    options: [
      "There is a 3% chance the null hypothesis is true",
      "The effect is 3% in size",
      "If the null hypothesis were true, results at least this extreme would occur about 3% of the time",
      "97% of the data supports the alternative hypothesis",
    ],
    correct: 2,
    explanation: "A p-value is the probability of data this extreme assuming the null is true. It is not the probability that the null is true.",
  },
  {
    id: "da-016", domain: "data-ai", topic: "Data handling", difficulty: 3,
    prompt: "You plan to use k-nearest neighbours with two features: annual income in rupees and age in years. Which preprocessing step matters most?",
    options: [
      "Sorting the rows by age",
      "Converting age to months",
      "Removing the income column",
      "Scaling the features to comparable ranges",
    ],
    correct: 3,
    explanation: "k-NN uses distances. Unscaled income, in the hundreds of thousands, would swamp age, so features must be put on similar scales.",
  },
  {
    id: "da-017", domain: "data-ai", topic: "Machine learning", difficulty: 3,
    prompt: "What does L2 regularisation do to a model during training?",
    options: [
      "Adds more training data",
      "Penalises large weights, which discourages overfitting",
      "Removes the test set",
      "Doubles the learning rate",
    ],
    correct: 1,
    explanation: "L2 adds the squared size of the weights to the loss, pushing the model towards simpler solutions that generalise better.",
  },
  {
    id: "da-018", domain: "data-ai", topic: "Deep learning & LLMs", difficulty: 3,
    prompt: "In the context of large language models, what is a token?",
    options: [
      "A unit of text, such as a word or word piece, that the model reads and produces",
      "A password for calling the model's API",
      "One complete conversation",
      "A layer in the neural network",
    ],
    correct: 0,
    explanation: "Text is split into tokens before the model sees it. Context limits and usage costs are counted in tokens.",
  },

  // Difficulty 4
  {
    id: "da-019", domain: "data-ai", topic: "Model evaluation", difficulty: 4,
    prompt: "A fraud model has precision 0.9 and recall 0.5. Which statement is correct?",
    options: [
      "It catches 90% of all fraud, and half of its alerts are wrong",
      "It is right 90% of the time overall",
      "90% of its alerts are real fraud, but it catches only half of all fraud",
      "It flags half of all transactions",
    ],
    correct: 2,
    explanation: "Precision is the share of alerts that are correct. Recall is the share of actual fraud cases that were caught.",
  },
  {
    id: "da-020", domain: "data-ai", topic: "Model evaluation", difficulty: 4,
    prompt: "Which of these is an example of data leakage?",
    options: [
      "Using a random seed for the train/test split",
      "Training on 80% of the data and testing on 20%",
      "Dropping a column that has many missing values",
      "Fitting a scaler on the full dataset before splitting it into train and test",
    ],
    correct: 3,
    explanation: "Fitting the scaler on all the data lets test-set statistics influence training, making test results look better than they should.",
  },
  {
    id: "da-021", domain: "data-ai", topic: "Machine learning", difficulty: 4,
    prompt: "As a model is made more complex, what typically happens to its bias and variance?",
    options: [
      "Both bias and variance fall",
      "Bias falls and variance rises",
      "Bias rises and variance falls",
      "Both stay the same",
    ],
    correct: 1,
    explanation: "A more flexible model fits the training data more closely (lower bias) but changes more with each new sample (higher variance).",
  },
  {
    id: "da-022", domain: "data-ai", topic: "Deep learning & LLMs", difficulty: 4,
    prompt: "What is the main benefit of retrieval-augmented generation (RAG) for a question-answering system?",
    options: [
      "Answers can be grounded in retrieved documents that are updated without retraining the model",
      "The model no longer needs a prompt",
      "It guarantees the model never makes a mistake",
      "It makes the model's weights smaller",
    ],
    correct: 0,
    explanation: "RAG supplies relevant documents at question time, so answers can cite current sources. It reduces unsupported claims but does not eliminate them.",
  },
  {
    id: "da-023", domain: "data-ai", topic: "Statistics", difficulty: 4,
    prompt: "During an A/B test you check the results every day and stop as soon as p < 0.05. What is wrong with this?",
    options: [
      "Nothing; it saves time",
      "It makes the sample too large",
      "Repeated checks inflate the chance of declaring a difference that is not real",
      "It makes the p-value larger than it should be",
    ],
    correct: 2,
    explanation: "Each look is another chance for noise to cross the threshold. Without a correction, the false-positive rate ends up well above 5%.",
  },
  {
    id: "da-024", domain: "data-ai", topic: "Data handling", difficulty: 4,
    prompt: "A LEFT JOIN from a customers table to an orders table returns more rows than the customers table contains. Why?",
    options: [
      "LEFT JOIN always doubles the number of rows",
      "The orders table has missing values",
      "Customers without orders are counted twice",
      "Customers with several orders appear once for each order",
    ],
    correct: 3,
    explanation: "A join produces one row per match, so a customer with three orders yields three rows. Customers without orders appear once.",
  },

  // Difficulty 5
  {
    id: "da-025", domain: "data-ai", topic: "Model evaluation", difficulty: 5,
    prompt: "Why is randomly shuffled k-fold cross-validation inappropriate for time-series forecasting?",
    options: [
      "It is too slow on time-series data",
      "It trains on observations from the future to predict the past, overstating performance",
      "It requires the data to be normally distributed",
      "It only works for classification",
    ],
    correct: 1,
    explanation: "Shuffling leaks future information into training. Forward-chaining splits, which always train on the past and test on the future, avoid this.",
  },
  {
    id: "da-026", domain: "data-ai", topic: "Deep learning & LLMs", difficulty: 5,
    prompt: "Why do transformer models need positional information added to their inputs?",
    options: [
      "Self-attention on its own does not depend on the order of the tokens",
      "To reduce the size of the vocabulary",
      "To make training use less memory",
      "Because tokens cannot otherwise be converted to vectors",
    ],
    correct: 0,
    explanation: "Self-attention treats its input as a set. Without positional information, a sentence and a shuffled copy of it would look the same.",
  },
  {
    id: "da-027", domain: "data-ai", topic: "Machine learning", difficulty: 5,
    prompt: "What is the key difference between how gradient boosting and a random forest build their trees?",
    options: [
      "Boosting uses deeper trees; random forests use only stumps",
      "Random forests need labelled data and boosting does not",
      "Boosting builds trees in sequence, each correcting the errors so far; a random forest builds independent trees and averages them",
      "There is no difference; the names are interchangeable",
    ],
    correct: 2,
    explanation: "Boosting is sequential and mainly reduces bias. A random forest trains trees independently on bootstrap samples and mainly reduces variance.",
  },
  {
    id: "da-028", domain: "data-ai", topic: "Statistics", difficulty: 5,
    prompt: "Treatment A has a higher success rate than treatment B among mild cases and also among severe cases, yet a lower success rate overall. What explains this?",
    options: [
      "A calculation error; it is mathematically impossible",
      "The sample is too small for any conclusion",
      "Random noise in the severe group",
      "The treatments were given to different mixes of mild and severe cases (Simpson's paradox)",
    ],
    correct: 3,
    explanation: "If A was mostly given to severe cases, its overall rate is pulled down. Severity confounds the comparison; this is Simpson's paradox.",
  },
  {
    id: "da-029", domain: "data-ai", topic: "Deep learning & LLMs", difficulty: 5,
    prompt: "A deep network's training loss becomes NaN after a few steps. Which is the most appropriate first fix?",
    options: [
      "Add more layers",
      "Lower the learning rate or clip the gradients",
      "Increase the batch size to the full dataset",
      "Remove the validation set",
    ],
    correct: 1,
    explanation: "NaN losses early in training usually come from exploding gradients. A smaller learning rate or gradient clipping keeps updates bounded.",
  },
  {
    id: "da-030", domain: "data-ai", topic: "Model evaluation", difficulty: 5,
    prompt: "On a dataset with 0.1% positives, a model has ROC AUC 0.95 but nearly all of its alerts are false alarms. Which evaluation is more informative here?",
    options: [
      "The precision–recall curve",
      "Accuracy",
      "Training loss",
      "ROC AUC on the training set",
    ],
    correct: 0,
    explanation: "With extreme imbalance, a tiny false-positive rate still produces far more false alarms than true hits. Precision–recall makes that visible.",
  },
];
