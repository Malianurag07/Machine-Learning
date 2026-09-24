# ML, Visually

An interactive website that teaches machine learning from scratch. Every lesson explains the idea in plain English, works the maths by hand on tiny numbers, and has interactive demos you can play with in the browser.

**Live site:** https://malianurag07.github.io/Machine-Learning/

## What you will learn (31 lessons)

| Section | Lessons |
|---|---|
| 1 · Basics | Introduction, Types of Machine Learning |
| 2 · ML Pipeline | ML Workflow, Data Pre-processing, Evaluation Metrics |
| 3 · Supervised Learning | Linear, Ridge and LASSO Regression, Logistic Regression, Naïve Bayes, KNN, Decision Tree, SVM, Random Forest, AdaBoost, Gradient Boosting, XGBoost, Grid Search CV |
| 4 · Unsupervised Learning | Clustering Overview, K-Means, DBSCAN, Hierarchical Clustering, PCA, LDA, Association Rule Learning |
| 5 · Semi-Supervised Learning | Label Propagation, Label Spreading |
| 6 · Reinforcement Learning | Model-Based and Model-Free Methods |
| 7 · Deployment | Deploying ML Models, Deployment using Streamlit |

Each lesson has: an analogy, worked examples with real numbers, 3–4 interactive demos, code with real outputs, real-world uses, key takeaways and a small optional task (no quizzes).

## Run it on your own laptop

You only need **VS Code** and **Python**. There is nothing to install and no build step.

1. Install [VS Code](https://code.visualstudio.com/) and [Python 3](https://www.python.org/downloads/) (tick "Add Python to PATH" on Windows) and [Git](https://git-scm.com/downloads).
2. Open VS Code, then open a terminal: **Terminal → New Terminal**.
3. Paste these three commands, one at a time:

```bash
git clone https://github.com/Malianurag07/Machine-Learning.git
```

```bash
cd Machine-Learning
```

```bash
python -m http.server 8765
```

4. Open **http://localhost:8765/index.html** in your browser. Done. Press `Ctrl + C` in the terminal to stop the server.

(On macOS/Linux, use `python3` instead of `python` if `python` is not found.)

### Even quicker options

- **Live Server:** in VS Code install the "Live Server" extension, then right-click `index.html` → **Open with Live Server**.
- **No server at all:** double-click `index.html`. Most lessons work this way too.

> An internet connection is needed the first time you view a page: the maths (KaTeX) and fonts are loaded from the web.

## Project structure

```
index.html            landing page
css/style.css         the whole design system
js/topics.js          the syllabus (which lessons exist and their order)
js/layout.js          sidebar, progress trail, table of contents, theme toggle
js/lib/               shared demo helpers (canvas, sliders, kernel SVM)
js/pages/             the interactive demos of each lesson
topics/               the lesson pages (HTML), grouped by section
PROJECT_NOTES.md      developer notes and lesson template
```

Built with plain HTML, CSS and vanilla JavaScript. Maths is rendered with [KaTeX](https://katex.org/).

## Adding or editing a lesson

1. Copy an existing lesson from `topics/` (for example `topics/08-deployment/deployment.html`) and its script from `js/pages/`.
2. Add or update its entry in `js/topics.js` (`ready: true` makes it appear).
3. Read `PROJECT_NOTES.md` for the lesson template and the small gotchas.

## About the code samples

The Python code shown in the lessons was run for real, and the outputs are quoted with the library versions stated in each lesson (for example scikit-learn 1.9.0). Where something could not be run or verified, the lesson says so.

## Contributing

Suggestions and fixes are welcome: open an issue or a pull request.

## License

No license has been chosen yet. Add a `LICENSE` file (for example MIT) if you want others to reuse the project.
