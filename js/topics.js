/* Syllabus manifest. Set ready:true when a lesson page exists. href is relative to the site root. */
window.ML = window.ML || {};
ML.topics = [
  { section: "1 · Basics", items: [
    { id: "intro", title: "Introduction", href: "topics/01-introduction.html", ready: true },
    { id: "types", title: "Types of Machine Learning", href: "topics/02-types-of-ml.html", ready: true },
  ]},
  { section: "2 · ML Pipeline", items: [
    { id: "workflow", title: "ML Workflow", href: "topics/03a-ml-workflow.html", ready: true },
    { id: "preprocessing", title: "Data Pre-processing", href: "topics/03b-data-preprocessing.html", ready: true },
    { id: "metrics", title: "Evaluation Metrics", href: "topics/03c-evaluation-metrics.html", ready: true },
  ]},
  { section: "3 · Supervised Learning", items: [
    { id: "linreg", title: "Linear Regression", href: "topics/04-supervised/linear-regression.html", ready: true },
    { id: "ridge", title: "Ridge Regression", href: "topics/04-supervised/ridge.html", ready: true, sub: true },
    { id: "lasso", title: "LASSO Regression", href: "topics/04-supervised/lasso.html", ready: true, sub: true },
    { id: "logreg", title: "Logistic Regression", href: "topics/04-supervised/logistic-regression.html", ready: true },
    { id: "nb", title: "Naïve Bayes", href: "topics/04-supervised/naive-bayes.html", ready: true },
    { id: "knn", title: "K-Nearest Neighbors", href: "topics/04-supervised/knn.html", ready: true },
    { id: "dt", title: "Decision Tree", href: "topics/04-supervised/decision-tree.html", ready: true },
    { id: "svm", title: "Support Vector Machine", href: "topics/04-supervised/svm.html", ready: true },
    { id: "rf", title: "Random Forest", href: "topics/04-supervised/random-forest.html", ready: true },
    { id: "ada", title: "AdaBoost", href: "topics/04-supervised/adaboost.html", ready: true },
    { id: "gb", title: "Gradient Boosting", href: "topics/04-supervised/gradient-boosting.html", ready: true },
    { id: "xgb", title: "XGBoost", href: "topics/04-supervised/xgboost.html", ready: true, sub: true },
    { id: "grid", title: "Grid Search CV", href: "topics/04-supervised/grid-search-cv.html", ready: true },
  ]},
  { section: "4 · Unsupervised Learning", items: [
    { id: "cluster", title: "Clustering Overview", href: "topics/05-unsupervised/clustering-overview.html", ready: true },
    { id: "kmeans", title: "K-Means", href: "topics/05-unsupervised/kmeans.html", ready: true, sub: true },
    { id: "dbscan", title: "DBSCAN", href: "topics/05-unsupervised/dbscan.html", ready: true, sub: true },
    { id: "hier", title: "Hierarchical Clustering", href: "topics/05-unsupervised/hierarchical.html", ready: true, sub: true },
    { id: "pca", title: "PCA", href: "topics/05-unsupervised/pca.html", ready: true },
    { id: "lda", title: "LDA", href: "topics/05-unsupervised/lda.html", ready: true },
    { id: "arl", title: "Association Rule Learning", href: "topics/05-unsupervised/association-rules.html", ready: true },
  ]},
  { section: "5 · Semi-Supervised Learning", items: [
    { id: "lprop", title: "Label Propagation", href: "topics/06-semi-supervised/label-propagation.html", ready: true },
    { id: "lspread", title: "Label Spreading", href: "topics/06-semi-supervised/label-spreading.html", ready: true },
  ]},
  { section: "6 · Reinforcement Learning", items: [
    { id: "mbased", title: "Model-Based Methods", href: "topics/07-reinforcement/model-based.html", ready: true },
    { id: "mfree", title: "Model-Free Methods", href: "topics/07-reinforcement/model-free.html", ready: true },
  ]},
  { section: "7 · Deployment", items: [
    { id: "deploy", title: "Deploying ML Models", href: "topics/08-deployment/deployment.html", ready: true },
    { id: "streamlit", title: "Deployment using Streamlit", href: "topics/08-deployment/streamlit.html", ready: true, sub: true },
  ]},
];
