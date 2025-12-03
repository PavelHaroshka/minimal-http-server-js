<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="style.css" />
    <title>{title}</title>
  </head>

  <body>
    <div className="container">
      <h1>{title}</h1>

      <p>
        This page was
        <strong>rendered using the {engine} template engine</strong>.
      </p>

      <h3>Try the same page rendered using other engines:</h3>
      <nav>
        {
          links && links.length ? (
            links.map((link) => <a href={link.href}>{link.label}</a>)
          ) : (
            <em>No links provided.</em>
          )
        }
      </nav>

      <div className="footer">
        <em>Rendered on {renderedAt}</em>
      </div>
    </div>

    <script src="script.js"></script>
  </body>
</html>
