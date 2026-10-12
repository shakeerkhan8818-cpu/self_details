// Create an element and safely add its class and text.
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (!isBlank(text)) element.textContent = String(text);
  return element;
}

// Check whether a value is missing or contains only whitespace.
function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// Keep only normal web and local file links from student data.
function safeUrl(value) {
  if (isBlank(value)) return '';
  const address = String(value).trim();
  try {
    const parsedAddress = new URL(address, window.location.href);
    if (['http:', 'https:', 'file:'].includes(parsedAddress.protocol)) return address;
  } catch (error) {
    return '';
  }
  return '';
}

// Hide an empty section and its matching navigation link.
function setSectionVisibility(sectionId, navId, shouldShow) {
  const section = document.getElementById(sectionId);
  const navLink = navId ? document.getElementById(navId) : null;
  if (section) section.style.display = shouldShow ? '' : 'none';
  if (navLink) navLink.style.display = shouldShow ? '' : 'none';
}

// Mark a missing image while leaving its reserved space in the layout.
function markImageUnavailable(event) {
  const image = event.currentTarget;
  image.classList.add('image-unavailable');

  const imageGrid = image.closest('.project-images-grid');
  if (!imageGrid) return;

  const remainingImages = imageGrid.querySelectorAll('img:not(.image-unavailable)');
  if (remainingImages.length === 0) imageGrid.classList.add('project-images-empty');
}

// Pass a failed image event to the shared image fallback.
function handleImageError(event) {
  markImageUnavailable(event);
}

// Expand a project preview after its first image loads successfully.
function handleImageLoad(event) {
  const image = event.currentTarget;
  if (image.naturalWidth === 0) {
    markImageUnavailable({ currentTarget: image });
    return;
  }

  const imageGrid = image.closest('.project-images-grid');
  if (imageGrid) {
    imageGrid.classList.remove('project-images-pending');
    imageGrid.classList.add('project-images-loaded');
  }
}

// Mark an image unavailable when the browser cannot decode its file.
function handleImageDecodeFailure() {
  markImageUnavailable({ currentTarget: this });
}
// Create a lazy-loaded image only when its source is usable.
function createImage(source, altText, className, width, height) {
  const imageUrl = safeUrl(source);
  if (!imageUrl) return null;

  const image = el('img', className);
  image.addEventListener('error', handleImageError);
  image.addEventListener('load', handleImageLoad);
  image.src = imageUrl;
  image.alt = isBlank(altText) ? '' : String(altText);
  image.loading = 'lazy';
  image.width = width;
  image.height = height;
  return image;
}

// Create a safe link that opens an external page in a new tab.
function createExternalLink(label, address, className) {
  const linkUrl = safeUrl(address);
  if (!linkUrl) return null;

  const link = el('a', className, label);
  link.href = linkUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

// Check project images after their card is connected to the page.
function checkProjectImage(image) {
  if (image.complete && image.naturalWidth === 0) {
    markImageUnavailable({ currentTarget: image });
    return;
  }
  if (typeof image.decode === 'function') {
    image.decode().catch(handleImageDecodeFailure.bind(image));
  }
}

// Fill the greeting, page title, tagline, and optional portrait.
function renderIntro(portfolio) {
  const fullName = isBlank(portfolio.fullName) ? 'Student' : String(portfolio.fullName).trim();
  const role = Array.isArray(portfolio.roles) && !isBlank(portfolio.roles[0])
    ? String(portfolio.roles[0]).trim()
    : 'Portfolio';
  const firstName = !isBlank(portfolio.firstName)
    ? String(portfolio.firstName).trim()
    : fullName.split(/\s+/)[0];

  document.title = `${fullName} -- ${role}`;

  const wordmark = document.getElementById('brand-mark');
  if (wordmark) wordmark.textContent = fullName;

  const heading = document.getElementById('hero-heading');
  if (heading) heading.textContent = `Hi, I'm ${firstName}`;

  const eyebrow = document.getElementById('hero-eyebrow');
  if (eyebrow) eyebrow.textContent = role.toUpperCase();

  const tagline = document.getElementById('hero-description');
  if (tagline) {
    tagline.textContent = isBlank(portfolio.tagline) ? '' : String(portfolio.tagline);
    tagline.style.display = isBlank(portfolio.tagline) ? 'none' : '';
  }

  const portraitContainer = document.getElementById('portrait-container');
  if (portraitContainer) {
    portraitContainer.textContent = '';
    const portrait = createImage(portfolio.portrait, `Portrait of ${fullName}`, '', 800, 1000);
    portraitContainer.style.display = portrait ? '' : 'none';
    if (portrait) portraitContainer.appendChild(portrait);
  }
}

// Show quick profile facts using only details already in the student data.
function renderProfileFacts(portfolio) {
  const container = document.getElementById('profile-facts');
  if (!container) return;
  container.textContent = '';

  const role = Array.isArray(portfolio.roles) && !isBlank(portfolio.roles[0])
    ? String(portfolio.roles[0]).trim()
    : '';
  const skills = Array.isArray(portfolio.skills) ? portfolio.skills : [];
  const skillGroups = [];
  for (const skill of skills) {
    if (skill && !isBlank(skill.category)) skillGroups.push(String(skill.category).trim());
    if (skillGroups.length === 2) break;
  }
  const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
  const facts = [
    ['Role', role],
    ['Toolkit', skillGroups.join(' / ')],
    ['Projects', projects.length ? `${projects.length} projects` : '']
  ];

  for (const factData of facts) {
    if (isBlank(factData[1])) continue;
    const fact = el('div', 'profile-fact');
    fact.appendChild(el('dt', 'profile-fact-label', factData[0]));
    fact.appendChild(el('dd', 'profile-fact-value', factData[1]));
    container.appendChild(fact);
  }
  container.style.display = container.childElementCount > 0 ? '' : 'none';
}

// Show the about text or hide the section when it is blank.
function renderAbout(about) {
  const text = about && about.text;
  setSectionVisibility('about', 'nav-about', !isBlank(text));

  const paragraph = document.getElementById('about-paragraph');
  if (paragraph) {
    paragraph.textContent = '';
    if (!isBlank(text)) {
      for (const character of Array.from(String(text))) {
        const characterSpan = document.createElement('span');
        characterSpan.className = 'about-char';
        characterSpan.textContent = character;
        paragraph.appendChild(characterSpan);
      }
    }
  }
}

// Build one row for every skills group and its named skills.
function renderSkills(skills) {
  const groups = Array.isArray(skills) ? skills : [];
  setSectionVisibility('skills', 'nav-skills', groups.length > 0);

  const container = document.getElementById('skills-container');
  if (!container) return;
  container.textContent = '';

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex] || {};
    const row = el('div', `skill-row reveal delay-${groupIndex % 5}`);
    row.appendChild(el('div', 'skill-number', String(groupIndex + 1).padStart(2, '0')));

    const body = el('div', 'skill-body');
    if (!isBlank(group.category)) body.appendChild(el('h3', 'skill-category', group.category));
    if (!isBlank(group.description)) body.appendChild(el('p', 'skill-description', group.description));

    const items = Array.isArray(group.items) ? group.items : [];
    const itemsGrid = el('div', 'skill-items-grid');
    for (const itemValue of items) {
      const item = itemValue || {};
      if (isBlank(item.name)) continue;

      const itemBox = el('div', 'skill-item');
      const header = el('div', 'skill-item-header');
      header.appendChild(el('span', 'skill-item-name', item.name));

      const level = Number(item.level);
      if (!isBlank(item.level) && Number.isFinite(level)) {
        const safeLevel = Math.max(0, Math.min(100, level));
        header.appendChild(el('span', 'skill-item-level', `${safeLevel}%`));
        const track = el('div', 'skill-progress-bar');
        const fill = el('div', 'skill-progress-fill');
        fill.style.width = `${safeLevel}%`;
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(safeLevel));
        track.setAttribute('aria-label', `${item.name} level`);
        track.appendChild(fill);
        itemBox.appendChild(header);
        itemBox.appendChild(track);
      } else {
        itemBox.appendChild(header);
      }
      itemsGrid.appendChild(itemBox);
    }

    if (itemsGrid.childElementCount > 0) body.appendChild(itemsGrid);
    row.appendChild(body);
    container.appendChild(row);
  }
}

// Build project cards, image previews, and optional project links.
function renderProjects(projects) {
  const entries = Array.isArray(projects) ? projects : [];
  setSectionVisibility('projects', 'nav-projects', entries.length > 0);

  const container = document.getElementById('projects-container');
  if (!container) return;
  container.textContent = '';

  for (let projectIndex = 0; projectIndex < entries.length; projectIndex += 1) {
    const project = entries[projectIndex] || {};
    const card = el('article', 'project-card reveal');
    const topRow = el('div', 'project-top-row');
    const meta = el('div', 'project-meta-left');
    meta.appendChild(el('span', 'project-number', String(projectIndex + 1).padStart(2, '0')));

    const titleGroup = el('div', 'project-category-title');
    if (!isBlank(project.category)) titleGroup.appendChild(el('span', 'project-category', project.category));
    titleGroup.appendChild(el('h3', 'project-title', project.title));
    meta.appendChild(titleGroup);
    topRow.appendChild(meta);

    const actions = el('div', 'project-actions');
    const liveLink = createExternalLink('Live Project', project.liveUrl, 'btn-ghost-pill');
    if (liveLink) {
      actions.appendChild(liveLink);
    } else {
      const disabledLink = el('button', 'btn-ghost-pill', 'Live Project');
      disabledLink.type = 'button';
      disabledLink.disabled = true;
      disabledLink.setAttribute('aria-disabled', 'true');
      actions.appendChild(disabledLink);
    }

    const codeLink = createExternalLink('GitHub', project.githubUrl, 'btn-ghost-pill');
    if (codeLink) actions.appendChild(codeLink);
    topRow.appendChild(actions);
    card.appendChild(topRow);

    if (!isBlank(project.description)) {
      card.appendChild(el('p', 'project-description', project.description));
    }

    const technologies = Array.isArray(project.techStack) ? project.techStack : [];
    const chips = el('div', 'project-tech-chips');
    for (const technology of technologies) {
      if (!isBlank(technology)) chips.appendChild(el('span', 'tech-chip', technology));
    }
    if (chips.childElementCount > 0) card.appendChild(chips);

    const imagePaths = Array.isArray(project.images) ? project.images : [];
    if (imagePaths.length > 0) {
      const imageGrid = el('div', 'project-images-grid');
      imageGrid.classList.add('project-images-pending');
      const leftImages = el('div', 'project-images-left');
      const rightImages = el('div', 'project-images-right');

      for (let imageIndex = 0; imageIndex < imagePaths.length; imageIndex += 1) {
        const imageClass = imageIndex === 0
          ? 'project-img-top'
          : imageIndex === 1
            ? 'project-img-bottom'
            : 'project-img-tall';
        const image = createImage(imagePaths[imageIndex], project.title, imageClass, 1200, 900);
        if (!image) continue;
        if (imageIndex < 2) leftImages.appendChild(image);
        else rightImages.appendChild(image);
      }

      if (leftImages.childElementCount > 0) imageGrid.appendChild(leftImages);
      if (rightImages.childElementCount > 0) imageGrid.appendChild(rightImages);
      if (imageGrid.childElementCount > 0) card.appendChild(imageGrid);
    }

    const cardContainer = el('div', 'project-card-container');
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);

    const projectImages = card.querySelectorAll('.project-images-grid img');
    for (const image of projectImages) checkProjectImage(image);
  }
}

// List academic entries and omit details that the student left blank.
function renderEducation(academics) {
  const entries = Array.isArray(academics) ? academics : [];
  setSectionVisibility('education', 'nav-education', entries.length > 0);

  const container = document.getElementById('education-container');
  if (!container) return;
  container.textContent = '';

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex] || {};
    const row = el('div', `education-row reveal delay-${entryIndex % 5}`);
    row.appendChild(el('div', 'education-number', String(entryIndex + 1).padStart(2, '0')));

    const body = el('div', 'education-body');
    body.appendChild(el('h3', 'education-degree', entry.degree));
    const details = [];
    if (!isBlank(entry.institution)) details.push(String(entry.institution));

    const startYear = isBlank(entry.startYear) ? '' : String(entry.startYear);
    const endYear = isBlank(entry.endYear) ? '' : String(entry.endYear);
    if (startYear && endYear) details.push(`${startYear} – ${endYear}`);
    else if (startYear || endYear) details.push(startYear || endYear);

    if (!isBlank(entry.grade)) details.push(String(entry.grade));
    if (!isBlank(entry.details)) details.push(String(entry.details));
    if (details.length > 0) body.appendChild(el('p', 'education-meta', details.join(' • ')));

    row.appendChild(body);
    container.appendChild(row);
  }
}

// Build achievement cards with an optional certificate or event image.
function renderAchievements(achievements) {
  const entries = Array.isArray(achievements) ? achievements : [];
  setSectionVisibility('achievements', null, entries.length > 0);

  const container = document.getElementById('achievements-container');
  if (!container) return;
  container.textContent = '';

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const achievement = entries[entryIndex] || {};
    const card = el('article', `achievement-card reveal delay-${entryIndex % 5}`);
    if (!isBlank(achievement.year)) {
      card.appendChild(el('span', 'achievement-year', achievement.year));
    }
    card.appendChild(el('h3', 'achievement-title', achievement.title));
    if (!isBlank(achievement.issuer)) {
      card.appendChild(el('span', 'achievement-issuer', achievement.issuer));
    }
    if (!isBlank(achievement.description)) {
      card.appendChild(el('p', 'achievement-desc', achievement.description));
    }

    const image = createImage(achievement.image, achievement.title, 'achievement-image', 1200, 900);
    if (image) {
      const imageFrame = el('div', 'achievement-media');
      imageFrame.appendChild(image);
      card.appendChild(imageFrame);
    }
    container.appendChild(card);
  }
}

// Build the optional gallery from image and caption pairs.
function renderGallery(gallery) {
  const entries = Array.isArray(gallery) ? gallery : [];
  const container = document.getElementById('gallery-container');
  if (!container) {
    setSectionVisibility('gallery', null, false);
    return;
  }
  container.textContent = '';

  for (const entryValue of entries) {
    const entry = entryValue || {};
    const caption = isBlank(entry.caption) ? '' : String(entry.caption);
    const image = createImage(entry.image, caption, 'gallery-image', 1200, 900);
    if (!image) continue;

    const figure = el('figure', 'gallery-item reveal');
    figure.appendChild(image);
    if (caption) figure.appendChild(el('figcaption', 'gallery-caption', caption));
    container.appendChild(figure);
  }

  setSectionVisibility('gallery', null, container.childElementCount > 0);
}

// Add email, phone, social, resume, and copyright details to the footer.
function renderContact(portfolio) {
  const contact = portfolio.contact || {};
  const socials = portfolio.socials || {};
  const linksContainer = document.getElementById('contact-links');

  if (linksContainer) {
    linksContainer.textContent = '';
    if (!isBlank(contact.email)) {
      const email = String(contact.email).trim();
      const emailLink = el('a', 'contact-link-item', email);
      emailLink.href = `mailto:${email}`;
      linksContainer.appendChild(emailLink);
    }
    if (!isBlank(contact.mobile)) {
      const mobile = String(contact.mobile).trim();
      const phoneLink = el('a', 'contact-link-item', mobile);
      phoneLink.href = `tel:${mobile.replace(/[^\d+]/g, '')}`;
      linksContainer.appendChild(phoneLink);
    }
    linksContainer.style.display = linksContainer.childElementCount > 0 ? '' : 'none';
  }

  const socialsContainer = document.getElementById('social-pills');
  if (socialsContainer) {
    socialsContainer.textContent = '';
    const socialLinks = [
      ['LinkedIn', socials.linkedin],
      ['GitHub', socials.github],
      ['Instagram', socials.instagram]
    ];
    for (const social of socialLinks) {
      const link = createExternalLink(social[0], social[1], 'btn-ghost-pill');
      if (link) socialsContainer.appendChild(link);
    }
    const resumeLink = createExternalLink('Resume', portfolio.resumeFile, 'btn-ghost-pill');
    if (resumeLink) socialsContainer.appendChild(resumeLink);
    socialsContainer.style.display = socialsContainer.childElementCount > 0 ? '' : 'none';
  }

  const footerButton = document.getElementById('footer-contact-btn');
  const footerButtonWrapper = footerButton ? footerButton.parentElement : null;
  if (footerButton && !isBlank(contact.email)) {
    footerButton.href = `mailto:${String(contact.email).trim()}`;
  } else if (footerButtonWrapper) {
    footerButtonWrapper.style.display = 'none';
  }

  const fullName = isBlank(portfolio.fullName) ? 'Student' : String(portfolio.fullName).trim();
  const role = Array.isArray(portfolio.roles) && !isBlank(portfolio.roles[0])
    ? String(portfolio.roles[0]).trim()
    : 'Portfolio';
  const copyright = document.getElementById('copyright-text');
  if (copyright) copyright.textContent = `© ${fullName} — ${role} ${new Date().getFullYear()}`;
}

let galleryAnimationFrame = 0;
let aboutAnimationFrame = 0;
let sceneAnimationFrame = 0;
let scenePointerX = 0;
let scenePointerY = 0;
let revealObserver = null;

// Check whether the visitor has asked for less motion.
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Toggle the compact navigation menu and update its accessible state.
function toggleMobileNavigation() {
  const button = document.getElementById('nav-toggle');
  const links = document.getElementById('primary-navigation');
  if (!button || !links) return;

  const isOpen = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!isOpen));
  links.classList.toggle('is-open', !isOpen);
}

// Close the compact navigation menu after choosing a page section.
function closeMobileNavigation() {
  const button = document.getElementById('nav-toggle');
  const links = document.getElementById('primary-navigation');
  if (!button || !links) return;

  button.setAttribute('aria-expanded', 'false');
  links.classList.remove('is-open');
}

// Let keyboard users close the compact navigation with Escape.
function handleNavigationKeydown(event) {
  if (event.key !== 'Escape') return;
  closeMobileNavigation();
  const button = document.getElementById('nav-toggle');
  if (button) button.focus();
}

// Connect the compact navigation button to its menu and keyboard controls.
function setupMobileNavigation() {
  const button = document.getElementById('nav-toggle');
  const links = document.getElementById('primary-navigation');
  if (!button || !links) return;

  button.addEventListener('click', toggleMobileNavigation);
  links.addEventListener('click', closeMobileNavigation);
  document.addEventListener('keydown', handleNavigationKeydown);
}

// Apply the latest pointer position to the CSS robot model.
function updateScenePointer() {
  const scene = document.getElementById('engineering-scene');
  sceneAnimationFrame = 0;
  if (!scene) return;

  scene.style.setProperty('--scene-pointer-x', `${scenePointerX}deg`);
  scene.style.setProperty('--scene-pointer-y', `${scenePointerY}deg`);
}

// Queue a gentle robot tilt from the pointer without blocking page input.
function handleScenePointerMove(event) {
  const scene = document.getElementById('engineering-scene');
  if (!scene) return;

  const bounds = scene.getBoundingClientRect();
  const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
  const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
  scenePointerX = Math.max(-6, Math.min(6, horizontal * 12));
  scenePointerY = Math.max(-5, Math.min(5, vertical * -10));
  if (!sceneAnimationFrame) sceneAnimationFrame = requestAnimationFrame(updateScenePointer);
}

// Return the robot to its resting position after pointer movement.
function resetScenePointer() {
  scenePointerX = 0;
  scenePointerY = 0;
  if (!sceneAnimationFrame) sceneAnimationFrame = requestAnimationFrame(updateScenePointer);
}

// Enable robot pointer tilt only when motion is allowed and a mouse is available.
function setupScenePointer() {
  if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;
  const scene = document.getElementById('engineering-scene');
  if (!scene) return;

  scene.addEventListener('pointermove', handleScenePointerMove);
  scene.addEventListener('pointerleave', resetScenePointer);
}

// Reveal observed content once it enters the visitor's viewport.
function handleRevealEntries(entries, observer) {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }
}

// Add reveal motion only when IntersectionObserver works in this browser.
function setupScrollReveals() {
  if (prefersReducedMotion() || typeof window.IntersectionObserver !== 'function') return;
  const revealItems = document.querySelectorAll('.reveal');
  if (revealItems.length === 0) return;

  try {
    revealObserver = new IntersectionObserver(handleRevealEntries, {
      threshold: 0.12,
      rootMargin: '0px 0px -32px 0px'
    });
    document.documentElement.classList.add('js');
    for (const item of revealItems) revealObserver.observe(item);
  } catch (error) {
    document.documentElement.classList.remove('js');
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;
  }
}

// Move the gallery gently as the visitor scrolls past it.
function updateGalleryMarqueeMovement() {
  galleryAnimationFrame = 0;
  const section = document.getElementById('gallery');
  const gallery = document.getElementById('gallery-container');
  if (!section || !gallery || section.style.display === 'none') return;

  const bounds = section.getBoundingClientRect();
  const distance = (window.innerHeight * 0.55 - bounds.top) * 0.025;
  const movement = Math.max(-24, Math.min(24, distance));
  gallery.style.transform = `translate3d(${movement}px, 0, 0)`;
}

// Schedule gallery movement once per animation frame while scrolling.
function scheduleGalleryMarqueeMovement() {
  if (!galleryAnimationFrame) galleryAnimationFrame = requestAnimationFrame(updateGalleryMarqueeMovement);
}

// Listen for scroll changes that move the gallery marquee.
function setupGalleryMarqueeMovement() {
  if (prefersReducedMotion() || !document.getElementById('gallery-container')) return;
  window.addEventListener('scroll', scheduleGalleryMarqueeMovement, { passive: true });
  window.addEventListener('resize', scheduleGalleryMarqueeMovement, { passive: true });
  scheduleGalleryMarqueeMovement();
}

// Update each About character as the paragraph travels through the viewport.
function updateAboutTextReveal() {
  aboutAnimationFrame = 0;
  const paragraph = document.getElementById('about-paragraph');
  if (!paragraph) return;

  const characters = paragraph.querySelectorAll('.about-char');
  if (characters.length === 0) return;

  const bounds = paragraph.getBoundingClientRect();
  const start = window.innerHeight * 0.8;
  const end = window.innerHeight * 0.2;
  const travel = start - end + bounds.height;
  const progress = Math.max(0, Math.min(1, (start - bounds.top) / travel));
  const revealedCount = Math.floor(progress * characters.length);

  for (let index = 0; index < characters.length; index += 1) {
    characters[index].style.color = index < revealedCount ? 'var(--text-light)' : 'var(--muted-gray)';
  }
}

// Schedule About text updates once per animation frame while scrolling.
function scheduleAboutTextReveal() {
  if (!aboutAnimationFrame) aboutAnimationFrame = requestAnimationFrame(updateAboutTextReveal);
}

// Enable the About text reveal only when reduced motion is not requested.
function setupAboutTextReveal() {
  if (prefersReducedMotion()) return;
  const paragraph = document.getElementById('about-paragraph');
  if (!paragraph || paragraph.childElementCount === 0) return;

  window.addEventListener('scroll', scheduleAboutTextReveal, { passive: true });
  window.addEventListener('resize', scheduleAboutTextReveal, { passive: true });
  scheduleAboutTextReveal();
}

// Print a friendly warning when one required value is blank.
function warnMissingValue(value, fieldPath) {
  if (isBlank(value)) console.warn(`data.js: ${fieldPath} is missing.`);
}

// Check the required fields in each student-editable list.
function validateCollection(entries, collectionName, requiredFields) {
  if (!Array.isArray(entries)) {
    console.warn(`data.js: ${collectionName} is missing or must be an array.`);
    return;
  }

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex] || {};
    for (const fieldName of requiredFields) {
      warnMissingValue(entry[fieldName], `${collectionName}[${entryIndex}].${fieldName}`);
    }
  }
}

// Check each skill group and its individual skill names.
function validateSkillItems(groups) {
  if (!Array.isArray(groups)) return;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex] || {};
    if (!Array.isArray(group.items)) {
      console.warn(`data.js: skills[${groupIndex}].items is missing or must be an array.`);
      continue;
    }
    for (let itemIndex = 0; itemIndex < group.items.length; itemIndex += 1) {
      const item = group.items[itemIndex] || {};
      warnMissingValue(item.name, `skills[${groupIndex}].items[${itemIndex}].name`);
    }
  }
}

// Check required portfolio details and report their exact data paths.
function validateData() {
  if (typeof PORTFOLIO === 'undefined' || !PORTFOLIO || typeof PORTFOLIO !== 'object') {
    console.warn('data.js: PORTFOLIO is missing or is not an object.');
    return;
  }

  warnMissingValue(PORTFOLIO.fullName, 'fullName');
  warnMissingValue(PORTFOLIO.firstName, 'firstName');
  warnMissingValue(Array.isArray(PORTFOLIO.roles) ? PORTFOLIO.roles[0] : '', 'roles[0]');
  warnMissingValue(PORTFOLIO.tagline, 'tagline');
  warnMissingValue(PORTFOLIO.about && PORTFOLIO.about.text, 'about.text');

  validateCollection(PORTFOLIO.skills, 'skills', ['category', 'description']);
  validateSkillItems(PORTFOLIO.skills);
  validateCollection(PORTFOLIO.projects, 'projects', ['title', 'category', 'description']);
  validateCollection(PORTFOLIO.academics, 'academics', ['degree', 'institution']);
  validateCollection(PORTFOLIO.achievements, 'achievements', ['title', 'issuer', 'year', 'description']);
}

// Render every page section after the data and HTML have loaded.
function init() {
  if (typeof PORTFOLIO === 'undefined' || !PORTFOLIO) {
    console.error('data.js: PORTFOLIO was not found. Check that data.js is linked before script.js.');
    return;
  }

  validateData();
  renderIntro(PORTFOLIO);
  renderProfileFacts(PORTFOLIO);
  renderAbout(PORTFOLIO.about);
  renderSkills(PORTFOLIO.skills);
  renderProjects(PORTFOLIO.projects);
  renderEducation(PORTFOLIO.academics);
  renderAchievements(PORTFOLIO.achievements);
  renderGallery(PORTFOLIO.gallery);
  renderContact(PORTFOLIO);
  setupMobileNavigation();
  setupScenePointer();
  setupScrollReveals();
  setupGalleryMarqueeMovement();
  setupAboutTextReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
