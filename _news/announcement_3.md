---
layout: post
title: Our Deep Active Localization paper is now on arXiv
date: 2019-03-04
inline: false
---

Active localization is the problem of generating robot actions that allow it to maximally disambiguate its pose within a reference map. Traditional approaches to this use an information-theoretic criterion for action selection and hand-crafted perceptual models. In this work we propose an end-to-end differentiable method for learning to take informative actions that is trainable entirely in simulation and then transferable to real robot hardware with zero refinement. The system is composed of two modules: a convolutional neural network for perception, and a deep reinforcement learned planning module. We introduce a multi-scale approach to the learned perceptual model since the accuracy needed to perform action selection with reinforcement learning is much less than the accuracy needed for robot control. We demonstrate that the resulting system outperforms using the traditional approach for either perception or planning. We also demonstrate our approaches robustness to different map configurations and other nuisance parameters through the use of domain randomization in training. The [code](https://github.com/montrealrobotics/dal) is also compatible with the OpenAI gym framework, as well as the Gazebo simulator.

[code](https://github.com/montrealrobotics/dal) 

[paper](https://arxiv.org/abs/1903.01669)