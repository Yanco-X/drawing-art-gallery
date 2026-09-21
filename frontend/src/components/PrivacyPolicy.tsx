import type { ReactNode } from 'react';
import { SITE_OWNER } from '../lib/siteOwner';

const PrivacyHeading = ({ title, intro }: { title: string; intro: string }) => (
  <>
    <h1 className="font-display text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-text">
      {title}
    </h1>
    <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">{intro}</p>
  </>
);

const PrivacySection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-10 max-w-[42em] space-y-3 text-[14px] leading-relaxed text-muted">
    <h2 className="font-display text-[22px] font-normal text-text">{title}</h2>
    {children}
  </section>
);

const Email = () => (
  <a
    href={`mailto:${SITE_OWNER.email}`}
    className="underline underline-offset-2 transition-colors duration-200 hover:text-accent"
  >
    {SITE_OWNER.email}
  </a>
);

export const PrivacyPolicyEnglish = () => (
  <div lang="en">
    <PrivacyHeading
      title="Privacy."
      intro="What this gallery keeps about its visitors, and the rights over the work it shows. In effect from 19 September 2026."
    />

    <PrivacySection title="Who is responsible">
      <p>
        {SITE_OWNER.legalName}, of {SITE_OWNER.city}, Colombia, runs this gallery and is
        responsible for the data described here. Write to <Email /> with any question or
        request about it.
      </p>
    </PrivacySection>

    <PrivacySection title="What is counted">
      <p>
        On your first visit, your browser makes a random ID and keeps it in its own
        storage on your device. It is made from nothing about you and is never linked to
        your name or to any other data. When you open the gallery, a piece, a piece's
        detailed view or a collection, the site records that ID, what you opened, whether
        you are on a phone or a computer, and the time.
      </p>
      <p>
        Your IP address, your browser's details, the page you came from and anything you
        type are not stored. The counts are used only to see how many people visit and
        what they look at. Only the gallery's owner reads them, and they are never sold,
        shared or combined with other data.
      </p>
    </PrivacySection>

    <PrivacySection title="How long it is kept">
      <p>
        The ID is replaced with a new one 13 months after it was made, and coming back
        does not extend it. Recorded visits are deleted after 25 months.
      </p>
    </PrivacySection>

    <PrivacySection title="Turning it off">
      <p>
        <em>Don't count mine</em>, at the foot of every page, deletes the ID from your
        browser and stops counting there. <em>Count mine</em> turns it back on with a new
        ID. Clearing this site's data in your browser also deletes the ID.
      </p>
    </PrivacySection>

    <PrivacySection title="Cookies and other storage">
      <p>
        The gallery sets no cookies for visitors. Besides the ID, your browser keeps your
        light or dark theme, and a note that stops a reload counting as a second visit.
        Signing in is for the gallery's owner alone, and its cookie is used for nothing
        else.
      </p>
    </PrivacySection>

    <PrivacySection title="Hosting">
      <p>
        The site runs on Railway and its images are stored with Cloudflare, whose servers
        may be outside Colombia. Like any web server, theirs receive your IP address in
        order to deliver the pages, and keep it in their logs for a limited time for
        security and operation. The gallery itself holds IP addresses only in memory, to
        limit abuse, and never saves them.
      </p>
    </PrivacySection>

    <PrivacySection title="Your rights">
      <p>
        Under Colombian law (Ley 1581 de 2012) you may ask to know, update, correct or
        delete the data about you, ask how it has been used, and withdraw your
        permission. Visitors in the European Union have the same rights under the GDPR,
        where the counting rests on a legitimate interest in knowing how the gallery is
        used.
      </p>
      <p>
        Because the ID is not linked to you, your records can only be found from the ID
        itself. Send the value your browser stores for this site under{' '}
        <code>sketchyart.visitor</code> to <Email />, and they will be deleted. Questions
        are answered within 10 business days and complaints within 15. If you are not
        satisfied, you may complain to Colombia's Superintendencia de Industria y
        Comercio, or to the data protection authority where you live.
      </p>
    </PrivacySection>

    <PrivacySection title="The artwork">
      <p>
        All artwork and photographs here are © {SITE_OWNER.legalName}. All rights are
        reserved, including reproduction and text and data mining, which covers training
        AI models (Article 4(3) of Directive (EU) 2019/790).
      </p>
      <p>
        Fan art shows characters that belong to their creators and rights holders, and is
        shared for no commercial purpose. If you appear in a piece, or hold rights in
        something shown here, and want it removed, write to <Email /> and it will be taken
        down.
      </p>
    </PrivacySection>

    <PrivacySection title="Changes">
      <p>
        If any of this changes, this page changes with it and the date at the top moves.
        The data described here is kept only while the gallery is online, and never
        beyond the limits above.
      </p>
    </PrivacySection>
  </div>
);

export const PrivacyPolicySpanish = () => (
  <div lang="es">
    <PrivacyHeading
      title="Privacidad."
      intro="Lo que esta galería guarda sobre sus visitantes, y los derechos sobre las obras que muestra. Vigente desde el 19 de septiembre de 2026."
    />

    <PrivacySection title="Responsable del tratamiento">
      <p>
        {SITE_OWNER.legalName}, de {SITE_OWNER.city}, Colombia, administra esta galería y
        es responsable del tratamiento de los datos descritos aquí. Escriba a <Email />{' '}
        con cualquier consulta o solicitud sobre ellos.
      </p>
    </PrivacySection>

    <PrivacySection title="Qué se cuenta">
      <p>
        En su primera visita, su navegador crea un identificador aleatorio y lo guarda en
        su propio almacenamiento, en su dispositivo. No se genera a partir de ningún dato
        suyo y nunca se vincula a su nombre ni a ningún otro dato. Cuando usted abre la
        galería, una obra, la vista detallada de una obra o una colección, el sitio
        registra ese identificador, lo que abrió, si usa un teléfono o un computador, y la
        hora.
      </p>
      <p>
        Su dirección IP, los datos de su navegador, la página desde la que llegó y
        cualquier cosa que escriba no se guardan. Los conteos se usan solo para saber
        cuántas personas visitan la galería y qué miran. Solo el dueño de la galería los
        consulta, y nunca se venden, se comparten ni se combinan con otros datos.
      </p>
    </PrivacySection>

    <PrivacySection title="Cuánto tiempo se guarda">
      <p>
        El identificador se reemplaza por uno nuevo 13 meses después de creado, y volver
        al sitio no extiende ese plazo. Las visitas registradas se eliminan a los 25
        meses.
      </p>
    </PrivacySection>

    <PrivacySection title="Cómo desactivarlo">
      <p>
        El botón <em>Don't count mine</em> («no contar las mías»), al pie de cada página,
        borra el identificador de su navegador y deja de contar sus visitas en él.{' '}
        <em>Count mine</em> («contar las mías») lo vuelve a activar con un identificador
        nuevo. Borrar los datos de este sitio en su navegador también elimina el
        identificador.
      </p>
    </PrivacySection>

    <PrivacySection title="Cookies y otro almacenamiento">
      <p>
        La galería no usa cookies para los visitantes. Además del identificador, su
        navegador guarda su elección de tema claro u oscuro, y una marca que evita que
        recargar la página cuente como una segunda visita. El inicio de sesión es solo
        para el dueño de la galería, y su cookie no se usa para nada más.
      </p>
    </PrivacySection>

    <PrivacySection title="Alojamiento">
      <p>
        El sitio funciona en Railway y sus imágenes se almacenan en Cloudflare, cuyos
        servidores pueden estar fuera de Colombia. Como cualquier servidor web, los suyos
        reciben su dirección IP para poder entregar las páginas, y la conservan en sus
        registros por un tiempo limitado, por seguridad y operación. La galería misma
        solo mantiene las direcciones IP en memoria, para limitar abusos, y nunca las
        guarda.
      </p>
    </PrivacySection>

    <PrivacySection title="Sus derechos">
      <p>
        Según la ley colombiana (Ley 1581 de 2012), usted puede conocer, actualizar,
        rectificar o suprimir los datos que le conciernen, preguntar qué uso se les ha
        dado y revocar su autorización. Los visitantes de la Unión Europea tienen los
        mismos derechos según el RGPD, donde el conteo se basa en el interés legítimo de
        saber cómo se usa la galería.
      </p>
      <p>
        Como el identificador no está vinculado a usted, sus registros solo se pueden
        encontrar a partir del propio identificador. Envíe el valor que su navegador
        guarda para este sitio bajo <code>sketchyart.visitor</code> a <Email />, y se
        eliminarán. Las consultas se responden en un plazo de 10 días hábiles y los
        reclamos en 15. Si no queda satisfecho, puede presentar una queja ante la
        Superintendencia de Industria y Comercio de Colombia, o ante la autoridad de
        protección de datos del lugar donde vive.
      </p>
    </PrivacySection>

    <PrivacySection title="Las obras">
      <p>
        Todas las obras y fotografías de este sitio son © {SITE_OWNER.legalName}. Todos
        los derechos reservados, incluidas la reproducción y la minería de textos y datos,
        que abarca el entrenamiento de modelos de inteligencia artificial (artículo 4,
        apartado 3, de la Directiva (UE) 2019/790).
      </p>
      <p>
        El fan art muestra personajes que pertenecen a sus creadores y titulares de
        derechos, y se comparte sin fines comerciales. Si usted aparece en una obra, o es
        titular de derechos sobre algo que se muestra aquí, y quiere que se retire,
        escriba a <Email /> y se retirará.
      </p>
    </PrivacySection>

    <PrivacySection title="Cambios">
      <p>
        Si algo de esto cambia, esta página cambia con ello y la fecha del inicio se
        actualiza. Los datos descritos aquí se conservan solo mientras la galería esté en
        línea, y nunca más allá de los plazos indicados.
      </p>
    </PrivacySection>
  </div>
);
