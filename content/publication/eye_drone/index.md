---
title: 'Eye in the sky: Drone-based object tracking and 3D localization'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - admin
  - Gaoang Wang
  - Zhichao Lei
  - Jenq-Neng Hwang


# Author notes (optional)
# author_notes:
#   - 'equal contribution'
#   - 'equal contribution'
#   - 'equal contribution'

date: '2019-10-15T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
publishDate: '2017-01-01T00:00:00Z'

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ['1']

# Publication name and optional abbreviated publication name.
publication: In *27th ACM International Conference on Multimedia*
publication_short: In *ACMMM 2019*

abstract: 'Drones, or general UAVs, equipped with a single camera have been widely deployed to a broad range of applications, such as aerial photography, fast goods delivery and most importantly, surveillance. Despite the great progress achieved in computer vision algorithms, these algorithms are not usually optimized for dealing with images or video sequences acquired by drones, due to various challenges such as occlusion, fast camera motion and pose variation. In this paper, a drone-based multi-object tracking and 3D localization scheme is proposed based on the deep learning based object detection. We first combine a multi-object tracking method called TrackletNet Tracker (TNT) which utilizes temporal and appearance information to track detected objects located on the ground for UAV applications. Then, we are also able to localize the tracked ground objects based on the group plane estimated from the Multi-View Stereo technique. The system deployed on the drone can not only detect and track the objects in a scene, but can also localize their 3D coordinates in meters with respect to the drone camera. The experiments have proved our tracker can reliably handle most of the detected objects captured by drones and achieve favorable 3D localization performance when compared with the state-of-the-art methods.'

# Summary. An optional shortened abstract.
summary: In this paper, a drone-based multi-object tracking and 3D localization scheme is proposed based on the deep learning based object detection. 

tags: []

# Display this page in the Featured widget?
featured: true

# Custom links (uncomment lines below)
# links:
# - name: Custom Link
#   url: http://example.org

url_pdf: 'https://arxiv.org/abs/1910.08259'
# url_code: 'https://github.com/microsoft/GLIP'
# url_dataset: ''
# url_poster: ''
url_project: 'https://dl.acm.org/doi/abs/10.1145/3343031.3350933'
# url_slides: ''
# url_source: 'https://github.com/wowchemy/wowchemy-hugo-themes'
# url_video: 'https://youtube.com'

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# image:
#   caption: ''
#   focal_point: ''
#   preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
# projects:
#   - example

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
# slides: example
---

<!-- {{% callout note %}}
Click the _Cite_ button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /callout %}} -->

<!-- {{% callout note %}}
Create your slides in Markdown - click the _Slides_ button to check out the example.
{{% /callout %}} -->

<!-- Supplementary notes can be added here, including [code, math, and images](https://wowchemy.com/docs/writing-markdown-latex/). -->
