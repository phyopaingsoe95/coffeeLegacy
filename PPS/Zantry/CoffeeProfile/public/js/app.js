// Aroma & Craft Coffee Specialist JS Application

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // ==========================================================================
    // Mobile Drawer Navigation
    // ==========================================================================
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const menuIcon = document.getElementById('menu-icon');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileLinks = document.querySelectorAll('.mobile-link, .btn-booking-mobile');

    menuToggle.addEventListener('click', () => {
        const isActive = mobileDrawer.classList.toggle('active');
        menuIcon.setAttribute('data-lucide', isActive ? 'x' : 'menu');
        lucide.createIcons();
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileDrawer.classList.remove('active');
            menuIcon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        });
    });

    // ==========================================================================
    // Tasting Lab: Interactive SVG Radar Chart
    // ==========================================================================
    const sliders = {
        acidity: document.getElementById('slide-acidity'),
        body: document.getElementById('slide-body'),
        sweetness: document.getElementById('slide-sweetness'),
        aroma: document.getElementById('slide-aroma'),
        aftertaste: document.getElementById('slide-aftertaste')
    };

    const valDisplays = {
        acidity: document.getElementById('val-acidity'),
        body: document.getElementById('val-body'),
        sweetness: document.getElementById('val-sweetness'),
        aroma: document.getElementById('val-aroma'),
        aftertaste: document.getElementById('val-aftertaste')
    };

    const nodes = {
        acidity: document.getElementById('node-acidity'),
        body: document.getElementById('node-body'),
        sweetness: document.getElementById('node-sweetness'),
        aroma: document.getElementById('node-aroma'),
        aftertaste: document.getElementById('node-aftertaste')
    };

    const radarPoly = document.getElementById('radar-polygon');
    const radarPolyGlow = document.getElementById('radar-polygon-glow');
    const btnAnalyze = document.getElementById('btn-analyze');
    const recPanel = document.getElementById('rec-panel');

    // Radar Center & Scales
    const CX = 200;
    const CY = 200;
    const MAX_VAL = 100;
    const MAX_RADIUS = 150;

    // Angles for 5-axis layout (Angles in Radians)
    // Starting at 12 o'clock (-PI/2) and distributing evenly by 72 deg (2*PI/5)
    const angles = {
        acidity: -Math.PI / 2,
        body: -Math.PI / 2 + (2 * Math.PI) / 5,
        sweetness: -Math.PI / 2 + (4 * Math.PI) / 5,
        aroma: -Math.PI / 2 + (6 * Math.PI) / 5,
        aftertaste: -Math.PI / 2 + (8 * Math.PI) / 5
    };

    // Calculate coordinate for a value on an axis
    function getCoordinate(value, angle) {
        const radius = (value / MAX_VAL) * MAX_RADIUS;
        const x = CX + radius * Math.cos(angle);
        const y = CY + radius * Math.sin(angle);
        return { x: x.toFixed(1), y: y.toFixed(1) };
    }

    // Update Radar Chart SVG points based on slider values
    function updateRadarChart() {
        const coords = {};
        
        // Compute coordinates for each axis
        for (const key in sliders) {
            const val = parseInt(sliders[key].value, 10);
            valDisplays[key].textContent = val;
            coords[key] = getCoordinate(val, angles[key]);
            
            // Move circular node dots
            nodes[key].setAttribute('cx', coords[key].x);
            nodes[key].setAttribute('cy', coords[key].y);
        }

        // Generate polygon points string "x1,y1 x2,y2..."
        const pointsStr = [
            `${coords.acidity.x},${coords.acidity.y}`,
            `${coords.body.x},${coords.body.y}`,
            `${coords.sweetness.x},${coords.sweetness.y}`,
            `${coords.aroma.x},${coords.aroma.y}`,
            `${coords.aftertaste.x},${coords.aftertaste.y}`
        ].join(' ');

        radarPoly.setAttribute('points', pointsStr);
        radarPolyGlow.setAttribute('points', pointsStr);
    }

    // Bind slider input handlers
    for (const key in sliders) {
        sliders[key].addEventListener('input', updateRadarChart);
    }

    // Initial render
    updateRadarChart();

    // Analyze flavor profile via Go API Backend
    btnAnalyze.addEventListener('click', async () => {
        btnAnalyze.disabled = true;
        btnAnalyze.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Matching...';
        lucide.createIcons();

        const payload = {
            acidity: parseInt(sliders.acidity.value, 10),
            body: parseInt(sliders.body.value, 10),
            sweetness: parseInt(sliders.sweetness.value, 10),
            aroma: parseInt(sliders.aroma.value, 10),
            aftertaste: parseInt(sliders.aftertaste.value, 10)
        };

        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API server returned error');

            const data = await response.json();

            if (data.success) {
                // Populate recommendation cards
                document.getElementById('rec-bean-title').textContent = data.recommended_bean;
                document.getElementById('rec-roast-level').textContent = data.roast_level;
                document.getElementById('rec-flavor-notes').textContent = data.flavor_notes;
                document.getElementById('rec-bean-desc').textContent = data.description;

                // Show panel
                recPanel.classList.remove('hidden');
                recPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (err) {
            console.error('Error fetching coffee recommendation:', err);
        } finally {
            btnAnalyze.disabled = false;
            btnAnalyze.innerHTML = '<i data-lucide="bar-chart-2"></i> Match Coffee Profile';
            lucide.createIcons();
        }
    });

    // ==========================================================================
    // Interactive Brew Assistant (Recipe Timer)
    // ==========================================================================
    const methodBtns = document.querySelectorAll('.method-btn');
    const coffeeSlider = document.getElementById('slide-coffee');
    const displayCoffee = document.getElementById('calc-coffee');
    const displayWater = document.getElementById('calc-water');
    const displayGrind = document.getElementById('calc-grind');
    const methodBrief = document.getElementById('method-brief-text');

    const timerRing = document.getElementById('timer-progress-ring');
    const timerDigits = document.getElementById('timer-digits');
    const stepNameDisplay = document.getElementById('timer-step-name');
    const stepDescDisplay = document.getElementById('timer-step-desc');
    const timerCard = document.querySelector('.brew-timer-card');
    
    const btnTimerToggle = document.getElementById('btn-timer-toggle');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const soundCheckbox = document.getElementById('sound-checkbox');

    // Recipes Config
    const recipes = {
        v60: {
            ratio: 16,
            grind: "Medium-Coarse",
            brief: "The V60 highlights clean notes and bright floral acidity. Our recipe uses 3 pours: Bloom, Main Pour, and Final Drawdown. Use 94°C filtered water.",
            steps: [
                { name: "BLOOM", duration: 45, desc: "Pour 60g water. Stir gently and wait to release CO2 gasses." },
                { name: "FIRST POUR", duration: 45, desc: "Pour in slow circular motion until water scale reads 200g." },
                { name: "FINAL POUR", duration: 45, desc: "Pour remaining water up to target. Let drawdown begin." },
                { name: "DRAWDOWN", duration: 45, desc: "Wait for drawdown. Swirl the decanter. Total time ~3:00 mins." }
            ]
        },
        frenchpress: {
            ratio: 15,
            grind: "Coarse (Chunky)",
            brief: "French Press extracts full body, oils, and heavy mouthfeel. Our steep recipe extracts deep chocolate notes. Water temperature 92°C.",
            steps: [
                { name: "INFUSION", duration: 60, desc: "Pour all target water. Stir crust floating on top 5 times." },
                { name: "STEEPING", duration: 180, desc: "Place lid on (do not plunge). Let it steep slowly for extraction." },
                { name: "PRESS & POUR", duration: 30, desc: "Plunge plunger down very slowly. Pour coffee immediately." }
            ]
        },
        aeropress: {
            ratio: 12,
            grind: "Medium-Fine",
            brief: "Aeropress brews full-bodied, high-clarity cups rapidly. Uses inverted method. Water temperature 85°C.",
            steps: [
                { name: "STEEP", duration: 60, desc: "Pour water. Stir continuously for 10 seconds. Steep." },
                { name: "PLUNGE", duration: 30, desc: "Flip on mug. Press down slowly (30s) until you hear a hiss." }
            ]
        }
    };

    let activeMethod = 'v60';
    let currentStep = 0;
    let secondsRemaining = 0;
    let stepDuration = 0;
    let timerId = null;
    let isTimerRunning = false;

    // Web Audio Synthesizer for Stage Sound Alerts
    let audioCtx = null;
    function playBeep(frequency = 880, duration = 0.15) {
        if (!soundCheckbox.checked) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            // Resume context if suspended (browser security policies)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            // Exponential decay
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio context failed to initialize:', e);
        }
    }

    // Calculate recipe weights based on selected method
    function calculateRecipe() {
        const coffee = parseInt(coffeeSlider.value, 10);
        displayCoffee.textContent = coffee;
        
        const recipe = recipes[activeMethod];
        const targetWater = coffee * recipe.ratio;
        
        displayWater.textContent = `${targetWater}g`;
        displayGrind.textContent = recipe.grind;
        methodBrief.textContent = recipe.brief;

        // If timer is not running, reset displays to stage 0
        if (!isTimerRunning && timerId === null) {
            resetTimerUI();
        }
    }

    // Toggle recipe methods
    methodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnTarget = e.currentTarget;
            methodBtns.forEach(b => b.classList.remove('active'));
            btnTarget.classList.add('active');
            
            activeMethod = btnTarget.getAttribute('data-method');
            
            // Stop running timer on recipe switch
            stopTimer();
            calculateRecipe();
        });
    });

    coffeeSlider.addEventListener('input', calculateRecipe);

    // Initial setup
    calculateRecipe();

    // Reset Timer Display States
    function resetTimerUI() {
        const currentRecipe = recipes[activeMethod];
        stepNameDisplay.textContent = "READY";
        stepDescDisplay.textContent = `Click Start to begin ${currentRecipe.steps[0].name}`;
        
        // Display total duration in digits
        const firstStepSecs = currentRecipe.steps[0].duration;
        timerDigits.textContent = formatTime(firstStepSecs);
        
        // Reset SVG progress ring
        timerRing.style.strokeDashoffset = 534;
        timerCard.classList.remove('running');
        
        btnTimerReset.disabled = true;
        btnTimerToggle.innerHTML = '<i data-lucide="play"></i> Start Brew';
        lucide.createIcons();
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Start Timer execution
    function startTimer() {
        if (timerId !== null) return;
        
        isTimerRunning = true;
        timerCard.classList.add('running');
        btnTimerReset.disabled = false;
        btnTimerToggle.innerHTML = '<i data-lucide="pause"></i> Pause';
        btnTimerToggle.style.backgroundColor = 'var(--color-primary-dark)';
        lucide.createIcons();

        const currentRecipe = recipes[activeMethod];
        
        // If timer is starting from absolute fresh state
        if (secondsRemaining === 0 && currentStep === 0) {
            currentStep = 0;
            secondsRemaining = currentRecipe.steps[0].duration;
            stepDuration = secondsRemaining;
            playBeep(660, 0.2); // Start beep
        }

        // Active countdown loop
        timerId = setInterval(() => {
            secondsRemaining--;
            
            // Render text digits
            timerDigits.textContent = formatTime(secondsRemaining);
            stepNameDisplay.textContent = currentRecipe.steps[currentStep].name;
            stepDescDisplay.textContent = currentRecipe.steps[currentStep].desc;

            // Render SVG Progress
            const circumference = 534;
            const completedRatio = (stepDuration - secondsRemaining) / stepDuration;
            const offset = circumference - (completedRatio * circumference);
            timerRing.style.strokeDashoffset = offset.toFixed(1);

            // Trigger alarms on ticks near end of stage
            if (secondsRemaining <= 3 && secondsRemaining > 0) {
                playBeep(880, 0.08); // small countdown tick beep
            }

            // Step transition check
            if (secondsRemaining <= 0) {
                playBeep(1100, 0.4); // Stage complete chime
                currentStep++;
                
                if (currentStep < currentRecipe.steps.length) {
                    // Start next step
                    secondsRemaining = currentRecipe.steps[currentStep].duration;
                    stepDuration = secondsRemaining;
                } else {
                    // All stages complete!
                    stopTimer();
                    timerDigits.textContent = "DONE";
                    stepNameDisplay.textContent = "COMPLETE";
                    stepDescDisplay.textContent = "Enjoy your freshly crafted cup!";
                    timerRing.style.strokeDashoffset = 0;
                    timerCard.classList.remove('running');
                    btnTimerToggle.disabled = true;
                }
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        isTimerRunning = false;
        timerCard.classList.remove('running');
        btnTimerToggle.innerHTML = '<i data-lucide="play"></i> Resume';
        btnTimerToggle.style.backgroundColor = 'var(--color-primary)';
        btnTimerToggle.disabled = false;
        lucide.createIcons();
    }

    // Toggle Button Play/Pause
    btnTimerToggle.addEventListener('click', () => {
        if (isTimerRunning) {
            stopTimer();
        } else {
            // Web audio requires user interaction
            playBeep(440, 0.05);
            startTimer();
        }
    });

    // Reset Timer fully
    btnTimerReset.addEventListener('click', () => {
        stopTimer();
        currentStep = 0;
        secondsRemaining = 0;
        stepDuration = 0;
        resetTimerUI();
    });


    // ==========================================================================
    // Consultation Booking: Real-time Form Validation & Go API Posting
    // ==========================================================================
    const bookingForm = document.getElementById('booking-form');
    const bookingSuccess = document.getElementById('booking-success');
    const successMsgText = document.getElementById('success-message-text');
    const btnSuccessReset = document.getElementById('btn-success-reset');

    const formFields = {
        name: document.getElementById('form-name'),
        email: document.getElementById('form-email'),
        service: document.getElementById('form-service'),
        date: document.getElementById('form-date'),
        notes: document.getElementById('form-notes')
    };

    const errMessages = {
        name: document.getElementById('err-name'),
        email: document.getElementById('err-email'),
        service: document.getElementById('err-service'),
        date: document.getElementById('err-date')
    };

    // Date Input Validation: Block past dates
    const today = new Date().toISOString().split('T')[0];
    formFields.date.setAttribute('min', today);

    // Validate a single field
    function validateField(name, value) {
        let isValid = true;

        switch (name) {
            case 'name':
                isValid = value.trim().length >= 2;
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                break;
            case 'service':
                isValid = value !== '';
                break;
            case 'date':
                isValid = value !== '' && value >= today;
                break;
        }

        const parent = formFields[name].closest('.form-field');
        if (isValid) {
            parent.classList.remove('invalid');
        } else {
            parent.classList.add('invalid');
        }

        return isValid;
    }

    // Attach real-time input listeners to remove errors once valid
    for (const key in formFields) {
        if (key === 'notes') continue;
        formFields[key].addEventListener('input', () => {
            validateField(key, formFields[key].value);
        });
    }

    // Select input needs change event
    formFields.service.addEventListener('change', () => {
        validateField('service', formFields.service.value);
    });

    // Form submit listener
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Perform final check
        let isFormValid = true;
        for (const key in formFields) {
            if (key === 'notes') continue;
            const valid = validateField(key, formFields[key].value);
            if (!valid) isFormValid = false;
        }

        if (!isFormValid) return;

        const btnSubmit = document.getElementById('btn-submit-booking');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span>Processing Booking...</span> <i data-lucide="loader" class="animate-spin"></i>';
        lucide.createIcons();

        // Build Payload
        const payload = {
            name: formFields.name.value,
            email: formFields.email.value,
            service: formFields.service.value,
            date: formFields.date.value,
            notes: formFields.notes.value
        };

        try {
            // Post via AJAX to Go API
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API booking failed');

            const resData = await response.json();

            if (resData.success) {
                // Display booking success panel
                successMsgText.textContent = resData.message;
                bookingForm.classList.add('hidden');
                bookingSuccess.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error submitting reservation request:', error);
            alert('Consultation booking error. Please make sure the Go server is running.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>Submit Booking Request</span> <i data-lucide="arrow-right"></i>';
            lucide.createIcons();
        }
    });

    // Reset from success back to booking form
    btnSuccessReset.addEventListener('click', () => {
        bookingForm.reset();
        
        // Remove active floats from labels
        document.querySelectorAll('.floating-group').forEach(group => {
            const input = group.querySelector('.form-input, .form-textarea');
            input.value = "";
        });

        bookingSuccess.classList.add('hidden');
        bookingForm.classList.remove('hidden');
    });
});
